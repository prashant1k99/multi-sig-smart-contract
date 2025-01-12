use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MultiSigAccount {
    #[max_len(24)]
    pub company_id: String, // Expected mongo ID
    pub threshhold: u8,
    pub treasury_account: Pubkey,
    pub treasury_bump: u8,
    pub bump: u8,
}
