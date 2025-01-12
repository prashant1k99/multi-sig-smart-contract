pub mod constants;
pub mod error;
pub mod helpers;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CyCee1ukFyDgRndFMW84d2nstCktbyUBzkpMVcHgX28d");

#[program]
pub mod multi_sig_smart_contract {
    use super::*;

    pub fn initialize_project(ctx: Context<InitializeMultiSig>, _company_id: String) -> Result<()> {
        initialize_multisig::handler(ctx)
    }
}
