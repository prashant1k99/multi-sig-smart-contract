use anchor_lang::prelude::*;

use crate::{
    MultiSigAccount, APPROVER_POSITION, EXECUTIONER_POSITION, OWNER_POSITION, PROPOSER_POSITION,
};

pub fn give_numeric_value_for_role(roles: Vec<u8>) -> u8 {
    roles.iter().fold(0u8, |result, &role| result | (1 << role))
}

pub fn has_permission(curr_user: Pubkey, permission: u8, multisig: &MultiSigAccount) -> bool {
    multisig
        .users
        .iter()
        .find(|user| user.key == curr_user)
        .map_or(false, |user| user.role & permission != 0)
}

pub fn is_valid_role(input_roles: &Vec<u8>) -> bool {
    input_roles.iter().all(|&role| match role {
        OWNER_POSITION | PROPOSER_POSITION | APPROVER_POSITION | EXECUTIONER_POSITION => true,
        _ => false,
    })
}
