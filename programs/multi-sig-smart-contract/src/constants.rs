use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";

#[constant]
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

// Roles
#[constant]
pub const PROPOSER: u8 = 1 << 1; // Permission to propose a transaction

#[constant]
pub const APPROVER: u8 = 1 << 2; // Permission to Approve a transaction

#[constant]
pub const EXECUTIONER: u8 = 1 << 3; // Permission to Execute a transaction

#[constant]
pub const OWNER: u8 = 1 << 4; // Super Permissions
