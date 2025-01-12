use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeMultiSig<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
}

pub fn handler(ctx: Context<InitializeMultiSig>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
}
