use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Unsupported Role passed for user")]
    UnsupportedRole,
    #[msg("User not authorized")]
    UserNotAuthorized,
}
