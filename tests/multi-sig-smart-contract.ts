import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MultiSigSmartContract as MultiSig } from "../target/types/multi_sig_smart_contract";

describe("multi-sig-smart-contract", () => {
  // Configure the client to use the local cluster.
  const companyID = "67840a280000000000000000"

  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.MultiSigSmartContract as Program<MultiSig>;
  const [multiSigAccountKey] = PublicKey.findProgramAddressSync([
    Buffer.from(companyID),
  ], program.programId);

  it("Should create MultiSig", async () => {
    const tx = await program.methods
      .initializeProject(companyID)
      .accounts({
        signer: payer.publicKey,
      })
      .rpc({
        commitment: "confirmed",
      });

    console.log("Transaction Signature: ", tx);

    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)
    console.log(multiSigAccount)
  });
});
