pub mod error;
pub mod helpers;

use anchor_lang::prelude::*;
use error::ErrorCode;

const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
const PROPOSER_POSITION: u8 = 0;
const APPROVER_POSITION: u8 = 1;
const EXECUTOR_POSITION: u8 = 2;
const OWNER_POSITION: u8 = 3;

declare_id!("CyCee1ukFyDgRndFMW84d2nstCktbyUBzkpMVcHgX28d");

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
            roles: helpers::give_numeric_value_for_role(roles),
        });
        Ok(())
    }

    pub fn remove_user(ctx: Context<CrudMultiSigAccount>, user_key: Pubkey) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;

        // Check for user exists
        require!(multisig.is_user(&user_key), ErrorCode::UserDoesNotExists);

        multisig.users.retain(|user| user.key != user_key);
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

        msg!("Accprover count: {}", approver_count);
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

        // Check if the signer has correct permission to propose transaction
        require!(
            helpers::has_permission(&ctx.accounts.proposer.key, PROPOSER_POSITION, multisig),
            ErrorCode::UserNotAuthorized
        );

        *ctx.accounts.proposition = Proposition {
            executed_by: None,
            proposer: *ctx.accounts.proposer.key,
            program_id: pid,
            accounts,
            data,
            bump: ctx.bumps.proposition,
            signers: vec![],
            did_execute: false,
        };

        multisig.transaction_count += 1;

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

    #[account(mut)]
    pub multisig: Account<'info, MultiSigAccount>,

    #[account(
        init,
        payer = proposer,
        space = ANCHOR_DISCRIMINATOR_SIZE + Proposition::INIT_SPACE,
        seeds = [
            b"proposition",
            multisig.key().as_ref(),
            &[multisig.transaction_count as u8]
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
    pub accounts: Vec<TransactionAccount>, // For executing transaction
    #[max_len(1000)]
    pub data: Vec<u8>,
    #[max_len(20)]
    pub signers: Vec<bool>,

    pub proposer: Pubkey,
    pub executed_by: Option<Pubkey>,
    pub program_id: Pubkey,
    pub did_execute: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}
