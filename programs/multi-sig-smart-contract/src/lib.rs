pub mod constants;
pub mod error;
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

    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        _company_id: String,
        _threshold: u8,
    ) -> Result<()> {
        initialize_project::handler(ctx)
    }
}
