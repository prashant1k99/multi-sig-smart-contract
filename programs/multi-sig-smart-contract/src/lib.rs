pub mod error;
pub mod helpers;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};
use error::ErrorCode;

const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
const PROPOSER_POSITION: u8 = 0;
const APPROVER_POSITION: u8 = 1;
const EXECUTOR_POSITION: u8 = 2;
const OWNER_POSITION: u8 = 3;

declare_id!("9zcFR2MWpuJSP7N6PgDeCAGZJ7C2EzzN5hYDLvy7AF4T");

#[program]
pub mod multi_sig_smart_contract {
    use super::*;

    pub fn initialize_project(ctx: Context<InitializeMultiSig>, company_id: String) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;
        let initializer = &ctx.accounts.signer;

        // Initialize multisig settings
        multisig.threshold = 1;
        multisig.company_id = company_id;

        // Add initializer as the first owner with all permissions
        multisig.users.push(UserInfo {
            key: initializer.key(),
            roles: helpers::give_numeric_value_for_role(vec![
                OWNER_POSITION,
                PROPOSER_POSITION,
                APPROVER_POSITION,
                EXECUTOR_POSITION,
            ]),
        });

        // Set PDA authority for treasury
        multisig.treasury = ctx.accounts.treasury.key();
        multisig.treasury_bump = ctx.bumps.treasury;
        multisig.bump = ctx.bumps.multisig;
        multisig.transaction_count = 0;
        Ok(())
    }

    pub fn add_user(
        ctx: Context<CrudMultiSigAccount>,
        user_key: Pubkey,
        roles: Vec<u8>,
    ) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        // Check for user already exists
        require!(!multisig.is_user(&user_key), ErrorCode::UserAlreadyExists);
        // Add Validation for roles
        require!(helpers::are_valid_roles(&roles), ErrorCode::UnsupportedRole);

        multisig.users.push(UserInfo {
            key: user_key,
            roles: helpers::give_numeric_value_for_role(roles.clone()),
        });
        Ok(())
    }

    pub fn remove_user(ctx: Context<CrudMultiSigAccount>, user_key: Pubkey) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        // Check for user exists
        require!(multisig.is_user(&user_key), ErrorCode::UserDoesNotExists);

        multisig.users.retain(|user| user.key != user_key);

        // Update threshold if the threshold is greater then approvel count then
        let approver_count = multisig
            .users
            .iter()
            .filter(|&user| helpers::check_role(user, APPROVER_POSITION))
            .count() as u8;

        if multisig.threshold > approver_count {
            multisig.threshold = approver_count
        }

        Ok(())
    }

    pub fn update_permission(
        ctx: Context<CrudMultiSigAccount>,
        user_key: Pubkey,
        roles: Vec<u8>,
    ) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        // Check for user exists
        require!(multisig.is_user(&user_key), ErrorCode::UserDoesNotExists);
        // Add Validation for roles
        require!(helpers::are_valid_roles(&roles), ErrorCode::UnsupportedRole);

        // Update permission
        for user in multisig.users.iter_mut() {
            if user.key == user_key {
                user.roles = helpers::give_numeric_value_for_role(roles);
                break;
            }
        }

        // Update threshold if the threshold is greater then approvel count then
        let approver_count = multisig
            .users
            .iter()
            .filter(|&user| helpers::check_role(user, APPROVER_POSITION))
            .count() as u8;

        if multisig.threshold > approver_count {
            multisig.threshold = approver_count
        }

        Ok(())
    }

    pub fn update_threshold(ctx: Context<CrudMultiSigAccount>, threshold: u8) -> Result<()> {
        // Check for total number of approvers, threshold should be less then equal to number of
        // approvers
        let multisig = &mut ctx.accounts.multisig;

        let approver_count = multisig
            .users
            .iter()
            .filter(|&user| helpers::check_role(user, APPROVER_POSITION))
            .count();

        require!(
            threshold <= (approver_count as u8),
            ErrorCode::ThresholdOverflow
        );

        multisig.threshold = threshold;

        Ok(())
    }

    pub fn propose(
        ctx: Context<InitProposal>,
        pid: Pubkey,
        accounts: Vec<TransactionAccount>,
        data: Vec<u8>,
    ) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        *ctx.accounts.proposition = Proposition {
            executed_by: None,
            proposer: *ctx.accounts.proposer.key,
            bump: ctx.bumps.proposition,
            signers: vec![],
            did_execute: false,
            program_id: pid,
            accounts,
            data,
        };

        multisig.transaction_count += 1;
        Ok(())
    }

    pub fn approve(ctx: Context<ApproveProposal>, is_approving: bool) -> Result<()> {
        let proposal = &mut ctx.accounts.proposition;

        let existing_vote_index = proposal
            .signers
            .iter()
            .position(|user| user.key == *ctx.accounts.approver.key);

        match existing_vote_index {
            Some(index) => {
                // Check if the vote is same
                if proposal.signers[index].favour == is_approving {
                    return Err(ErrorCode::UserAlreadyVoted.into());
                }
                // Update existing vote
                proposal.signers[index].favour = is_approving;
            }
            None => {
                proposal.signers.push(ApproverVotes {
                    key: *ctx.accounts.approver.key,
                    favour: is_approving,
                });
            }
        }

        Ok(())
    }

    pub fn execute(ctx: Context<ExecuteProposal>) -> Result<()> {
        let multisig = &ctx.accounts.multisig;
        let proposal = &mut ctx.accounts.proposition;
        let treasury = &ctx.accounts.treasury;

        require!(!proposal.did_execute, ErrorCode::TransactionAlreadyExecuted);

        let favoured_vote_count = proposal
            .signers
            .iter()
            .filter(|vote| vote.favour == true)
            .count() as u8;

        msg!(
            "Executor Id: {} \n TreasuryAccount ID: {} \n Proposal Id: {}",
            &ctx.accounts.executor.key,
            &ctx.accounts.treasury.key,
            proposal.key()
        );

        require!(
            favoured_vote_count >= multisig.threshold,
            ErrorCode::InsufficientVotes
        );

        // Create seeds for PDA signer
        let treasury_seeds = &[
            b"treasury",
            multisig.company_id.as_bytes(),
            &[multisig.treasury_bump],
        ];

        msg!("Executing Transaction");
        let mut transaction_accounts = Vec::new();

        // Add treasury as the first account if it needs to sign
        transaction_accounts.push(AccountMeta {
            pubkey: treasury.key(),
            is_signer: true,
            is_writable: true,
        });

        // Add remaining accounts from the proposal
        transaction_accounts.extend(
            proposal
                .accounts
                .iter()
                .filter(|account| account.pubkey != *treasury.key) // removing
                // treasury account if it is already part of the list
                .map(|acc| AccountMeta {
                    pubkey: acc.pubkey,
                    is_signer: acc.is_signer, // Remove original signers since treasury will sign
                    is_writable: acc.is_writable,
                }),
        );

        msg!("Seeds: {:?}", treasury_seeds);
        msg!("Accounts: {:?}", transaction_accounts);

        // Execute the instruction with treasury as signer
        let instruction = Instruction {
            program_id: proposal.program_id,
            accounts: transaction_accounts,
            data: proposal.data.clone(),
        };
        invoke_signed(&instruction, ctx.remaining_accounts, &[treasury_seeds])?;

        // Mark proposal as executed
        proposal.did_execute = true;
        proposal.executed_by = Some(ctx.accounts.executor.key());

        Ok(())
    }
}

impl MultiSigAccount {
    pub fn is_user(&self, user_key: &Pubkey) -> bool {
        self.users.iter().any(|user| user.key == *user_key)
    }
    pub fn is_owner(&self, user_key: &Pubkey) -> bool {
        helpers::has_permission(user_key, OWNER_POSITION, self)
    }
    pub fn is_proposer(&self, user_key: &Pubkey) -> bool {
        helpers::has_permission(user_key, PROPOSER_POSITION, self)
    }
    pub fn is_approver(&self, user_key: &Pubkey) -> bool {
        helpers::has_permission(user_key, APPROVER_POSITION, self)
    }
    pub fn is_executor(&self, user_key: &Pubkey) -> bool {
        helpers::has_permission(user_key, EXECUTOR_POSITION, self)
    }
}

#[derive(Accounts)]
#[instruction(company_id: String)]
pub struct InitializeMultiSig<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE + MultiSigAccount::INIT_SPACE,
        seeds = [company_id.as_bytes()],
        bump,
    )]
    pub multisig: Account<'info, MultiSigAccount>,

    #[account(
        init,
        payer = signer,
        space = 0, // No data stored. It holds SOL
        seeds = [b"treasury", company_id.as_bytes()],
        bump
    )]
    /// CHECK: This is a PDA that will hold SOL and sign transactions
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MultiSigAccount {
    #[max_len(24)]
    pub company_id: String, // Expected mongo ID

    #[max_len(20)]
    pub users: Vec<UserInfo>,

    pub threshold: u8,
    pub treasury: Pubkey,
    pub treasury_bump: u8,
    pub transaction_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserInfo {
    pub key: Pubkey,
    pub roles: u8,
}

#[derive(Accounts)]
pub struct CrudMultiSigAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = multisig.is_owner(&signer.key()) @ ErrorCode::UserNotAuthorized
    )]
    pub multisig: Account<'info, MultiSigAccount>,
}

#[derive(Accounts)]
pub struct InitProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        constraint = multisig.is_proposer(&proposer.key()) @ ErrorCode::UserNotAuthorized
    )]
    pub multisig: Account<'info, MultiSigAccount>,

    #[account(
        init,
        payer = proposer,
        space = ANCHOR_DISCRIMINATOR_SIZE + Proposition::INIT_SPACE,
        seeds = [
            b"proposition",
            multisig.key().as_ref(),
            &multisig.transaction_count.to_le_bytes()
        ],
        bump
    )]
    pub proposition: Account<'info, Proposition>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Proposition {
    #[max_len(3)]
    accounts: Vec<TransactionAccount>,
    #[max_len(1000)]
    data: Vec<u8>,
    program_id: Pubkey,

    #[max_len(20)]
    pub signers: Vec<ApproverVotes>, // For users who approve transaction

    pub proposer: Pubkey,
    pub executed_by: Option<Pubkey>,
    pub did_execute: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ApproverVotes {
    key: Pubkey,
    favour: bool,
}

#[account]
#[derive(InitSpace)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

#[derive(Accounts)]
pub struct ApproveProposal<'info> {
    #[account(mut)]
    pub approver: Signer<'info>,

    #[account(
        constraint = multisig.is_approver(&approver.key()) @ ErrorCode::UserNotAuthorized
    )]
    pub multisig: Account<'info, MultiSigAccount>,

    #[account(
        mut,
        constraint = !proposition.did_execute @ ErrorCode::TransactionAlreadyExecuted
    )]
    pub proposition: Account<'info, Proposition>,
}

#[derive(Accounts)]
#[instruction()]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,

    #[account(
        constraint = multisig.is_executor(&executor.key()) @ ErrorCode::UserNotAuthorized,
    )]
    pub multisig: Account<'info, MultiSigAccount>,

    #[account(
        mut,
        constraint = !proposition.did_execute @ ErrorCode::TransactionAlreadyExecuted
    )]
    pub proposition: Account<'info, Proposition>,

    #[account(mut)]
    /// CHECK: This is a PDA that will hold SOL and sign transactions
    pub treasury: UncheckedAccount<'info>,
}
