use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[constant]
pub const PROPOSER_POSITION: u8 = 0;

#[constant]
pub const APPROVER_POSITION: u8 = 1;

#[constant]
pub const EXECUTIONER_POSITION: u8 = 2;

#[constant]
pub const OWNER_POSITION: u8 = 3;
