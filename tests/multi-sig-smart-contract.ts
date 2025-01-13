import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
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

  const [treasuryAccountKey] = PublicKey.findProgramAddressSync([
    Buffer.from("treasury"),
    Buffer.from(companyID),
  ], program.programId)

  const proposerUser = Keypair.generate()

  it("Should create MultiSig", async () => {
    await program.methods
      .initializeProject(companyID)
      .accounts({
        signer: payer.publicKey,
      })
      .rpc({
        commitment: "confirmed",
      });

    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)
    assert.equal(multiSigAccount.companyId.toString(), companyID)
    assert.equal(multiSigAccount.users[0].key.toString(), payer.publicKey.toString())
    assert.equal(multiSigAccount.treasury.toString(), treasuryAccountKey.toString())

    const treasuryBalance = await provider.connection.getBalance(treasuryAccountKey);
    assert.equal(Math.floor(treasuryBalance / LAMPORTS_PER_SOL), 0)
  });

  it("should add money to treasury account", async () => {
    // We need to airdrop some amount in the treasyry PDA
    const initialTreasuryAccountBalance = await provider.connection.getBalance(treasuryAccountKey);

    const toAdd = 100 * LAMPORTS_PER_SOL;
    const tx = await provider.connection.requestAirdrop(
      treasuryAccountKey,
      toAdd // 100 SOL
    );

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");

    const balance = await provider.connection.getBalance(treasuryAccountKey);
    assert.equal(initialTreasuryAccountBalance + toAdd, balance)
  });

  it("Should add other users", async () => {
    await program.methods.addUser(
      proposerUser.publicKey,
      Buffer.from([0]) // Proposer Role
    ).accounts({
      multisig: multiSigAccountKey
    }).rpc({
      commitment: "confirmed",
    });

    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)
  })
});
