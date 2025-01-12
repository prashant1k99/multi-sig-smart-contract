use anchor_lang::prelude::*;

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
