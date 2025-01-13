pub mod error;
pub mod helpers;

use anchor_lang::prelude::*;

const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
const PROPOSER_POSITION: u8 = 0;
const APPROVER_POSITION: u8 = 1;
const EXECUTIONER_POSITION: u8 = 2;
const OWNER_POSITION: u8 = 3;

declare_id!("CyCee1ukFyDgRndFMW84d2nstCktbyUBzkpMVcHgX28d");

#[program]
pub mod multi_sig_smart_contract {
    use super::*;

    pub fn initialize_project(ctx: Context<InitializeMultiSig>, company_id: String) -> Result<()> {
        msg!("starting");
        let multisig = &mut ctx.accounts.multisig;
        let initializer = &ctx.accounts.signer;

        msg!("Point 1");
        // Initialize multisig settings
        multisig.threshold = 1;
        multisig.company_id = company_id;

        // Add initializer as the first owner with all permissions
        multisig.users.push(UserInfo {
            key: initializer.key(),
            role: helpers::give_numeric_value_for_role(vec![
                OWNER_POSITION,
                PROPOSER_POSITION,
                APPROVER_POSITION,
                EXECUTIONER_POSITION,
            ]),
        });

        msg!("Point 2");
        // Set PDA authority for treasury
        multisig.treasury = ctx.accounts.treasury.key();
        multisig.treasury_bump = ctx.bumps.treasury;
        multisig.bump = ctx.bumps.multisig;

        msg!("Finished");
        Ok(())
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
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserInfo {
    pub key: Pubkey,
    pub role: u8,
}
