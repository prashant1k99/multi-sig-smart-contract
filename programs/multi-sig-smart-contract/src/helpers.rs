use anchor_lang::prelude::*;

use crate::MultiSigAccount;

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
