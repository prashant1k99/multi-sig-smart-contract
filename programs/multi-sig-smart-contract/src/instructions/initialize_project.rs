use anchor_lang::prelude::*;

pub use crate::state::project::MultiSigAccount;
pub use crate::ANCHOR_DISCRIMINATOR_SIZE;

#[derive(Accounts)]
#[instruction(company_id: String)]
pub struct InitializeProject<'info> {
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

pub fn handler(ctx: Context<InitializeProject>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
}
