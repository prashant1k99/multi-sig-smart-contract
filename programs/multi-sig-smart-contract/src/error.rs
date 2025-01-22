use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Unsupported Role passed for user")]
    UnsupportedRole,
    #[msg("User not authorized")]
    UserNotAuthorized,
    #[msg("User already exists")]
    UserAlreadyExists,
    #[msg("User does not exists")]
    UserDoesNotExists,
    #[msg("Threshold value is more then approver count")]
    ThresholdOverflow,
    #[msg("Invalid treasury key")]
    InvalidTreasury,
    #[msg("Invalid calculation")]
    InvalidCalculation,
    #[msg("Inufficient funds in treasury for action")]
    InsufficientTreasuryFunds,
    #[msg("User has already voted")]
    UserAlreadyVoted,
    #[msg("Required vote count is not met")]
    InsufficientVotes,
    #[msg("This transaction already executed")]
    TransactionAlreadyExecuted,
    #[msg("Invalid transfer amount")]
    InvalidTransferAmount,
    #[msg("Invalid program instruction")]
    InvalidProgramInstruction,
    #[msg("User Limit reached")]
    MaxUsersReached,
}
