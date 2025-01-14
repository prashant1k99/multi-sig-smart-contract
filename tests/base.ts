import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MultiSigSmartContract as MultiSig } from "../target/types/multi_sig_smart_contract";

export let provider: anchor.AnchorProvider;
export let program: Program<MultiSig>;
export let payer: anchor.Wallet;
export const companyID = "67840a280000000000000000";
export let multiSigAccountKey: PublicKey;
export let treasuryAccountKey: PublicKey;
export const otherUser = Keypair.generate();
export const proposer = Keypair.generate();
export const approver = Keypair.generate();
export const executor = Keypair.generate();


export const setup = () => {
  provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  payer = provider.wallet as anchor.Wallet;
  program = anchor.workspace.MultiSigSmartContract as Program<MultiSig>;

  [multiSigAccountKey] = PublicKey.findProgramAddressSync([
    Buffer.from(companyID),
  ], program.programId);

  [treasuryAccountKey] = PublicKey.findProgramAddressSync([
    Buffer.from("treasury"),
    Buffer.from(companyID),
  ], program.programId)
}


