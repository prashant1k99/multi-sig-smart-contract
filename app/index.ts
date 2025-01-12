import MultiSigIDL from "./multi_sig_smart_contract.json";
import { MultiSigSmartContract as MultiSig } from "./multi_sig_smart_contract";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";

// Re-export the generated IDL and type
export { MultiSig, MultiSigIDL };

// The programId is imported from the program IDL.
export const MULTI_SIG_PROGRAM_ID = new PublicKey(MultiSigIDL.address);

// This is a helper function to get the Vesting Anchor program.
export function getMultiSigProgram(provider: AnchorProvider) {
  return new Program(MultiSigIDL as MultiSig, provider);
}

// This is a helper function to get the program ID for the Vesting program depending on the cluster.
export function getVestingProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the Vesting program on devnet and testnet.
      return new PublicKey("8RBLvGLkXZkTXuA6WJhKTC1F7raEqfhBL69BkcaYTZL1");
    case "mainnet-beta":
    default:
      return MULTI_SIG_PROGRAM_ID;
  }
}
