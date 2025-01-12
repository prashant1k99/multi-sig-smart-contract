use anchor_lang::prelude::*;

pub use crate::state::multi_sig::MultiSigAccount;

use crate::helpers::give_numeric_value_for_role;
use crate::{
    ANCHOR_DISCRIMINATOR_SIZE, APPROVER_POSITION, EXECUTIONER_POSITION, OWNER_POSITION,
    PROPOSER_POSITION,
};

#[derive(Accounts)]
#[instruction(company_id: String)]
pub struct InitializeMultiSig<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE + MultiSigAccount::INIT_SPACE,
        seeds = [b"project".as_ref(), company_id.as_bytes()],
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

pub fn handler(ctx: Context<InitializeMultiSig>) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    let initializer = &ctx.accounts.signer;

    // Initialize multisig settings
    multisig.threshold = 1;

    // Add initializer as the first owner with all permissions
    multisig.users.push(crate::multi_sig::UserInfo {
        key: initializer.key(),
        role: give_numeric_value_for_role(vec![
            OWNER_POSITION,
            PROPOSER_POSITION,
            APPROVER_POSITION,
            EXECUTIONER_POSITION,
        ]),
    });

    // Set PDA authority for treasury
    multisig.treasury = ctx.accounts.treasury.key();
    multisig.treasury_bump = ctx.bumps.treasury;
    multisig.bump = ctx.bumps.multisig;

    Ok(())
}
