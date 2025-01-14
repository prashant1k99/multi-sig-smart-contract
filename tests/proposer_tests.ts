import { PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { program, proposer, companyID, multiSigAccountKey, treasuryAccountKey, setup } from './base';

describe("proposal testing", () => {
  before(() => {
    setup()
  })

  it("should create a proposal", async () => {
    const multisigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey);
    assert.exists(multisigAccount, "Multi Sig account should exist")

    // Transaction to propose
    const simpleTransaction = SystemProgram.transfer({
      fromPubkey: treasuryAccountKey,
      toPubkey: proposer.publicKey,
      lamports: 100000,
    })

    const [propositionKey] = PublicKey.findProgramAddressSync([
      Buffer.from("proposition"),
      multiSigAccountKey.toBytes(),
      Buffer.from([multisigAccount.transactionCount])
    ], program.programId)

    const modifiedKeys = simpleTransaction.keys.map(k => ({
      pubkey: k.pubkey,
      isSigner: false,
      isWritable: k.pubkey.equals(treasuryAccountKey) || k.pubkey.equals(proposer.publicKey)
    }));

    // Propose with
    await program.methods.propose(
      SystemProgram.programId,
      modifiedKeys,
      simpleTransaction.data,
    ).accounts({
      multisig: multiSigAccountKey,
      proposer: proposer.publicKey,
      proposition: propositionKey,
    }).signers([proposer]).rpc({
      commitment: "confirmed",
      skipPreflight: true
    })

    const proposition = await program.account.proposition.fetch(propositionKey);
    assert.exists(proposition, "Proposition should be created");
    assert.equal(proposition.proposer.toString(), proposer.publicKey.toString())
    assert.isEmpty(proposition.signers)
    assert.isFalse(proposition.didExecute, "didExecute should be false for newly created proposition")
    assert.deepEqual(proposition.data, simpleTransaction.data)
    assert.deepEqual(proposition.accounts, modifiedKeys)
  })
})

