use anchor_lang::prelude::*;

use crate::{
    MultiSigAccount, UserInfo, APPROVER_POSITION, EXECUTOR_POSITION, OWNER_POSITION,
    PROPOSER_POSITION,
};

pub fn give_numeric_value_for_role(roles: Vec<u8>) -> u8 {
    roles.iter().fold(0u8, |result, &role| result | (1 << role))
}

pub fn has_permission(user_key: &Pubkey, role_position: u8, multisig: &MultiSigAccount) -> bool {
    multisig
        .users
        .iter()
        .any(|user| user.key == *user_key && ((user.roles >> role_position) & 1) == 1)
}

pub fn are_valid_roles(input_roles: &Vec<u8>) -> bool {
    input_roles.iter().all(|&role| match role {
        OWNER_POSITION | PROPOSER_POSITION | APPROVER_POSITION | EXECUTOR_POSITION => true,
        _ => false,
    })
}

pub fn check_role(user: &UserInfo, role: u8) -> bool {
    (user.roles >> role) & 1 == 1
}
