import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { program, proposer, multiSigAccountKey, treasuryAccountKey, setup, approver, otherUser, randomUser, addBalance } from './base';

describe("Proposal Testing", () => {
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

    // Propose with
    await program.methods.propose(
      SystemProgram.programId,
      simpleTransaction.keys,
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
    assert.deepEqual(proposition.accounts, simpleTransaction.keys)
  })

  it("should not create a proposal when approver tries", async () => {
    const multisigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey);
    assert.exists(multisigAccount, "Multi Sig account should exist")

    // Transaction to propose
    const simpleTransaction = SystemProgram.transfer({
      fromPubkey: treasuryAccountKey,
      toPubkey: proposer.publicKey,
      lamports: 100000,
    });

    const [propositionKey] = PublicKey.findProgramAddressSync([
      Buffer.from("proposition"),
      multiSigAccountKey.toBytes(),
      Buffer.from([multisigAccount.transactionCount])
    ], program.programId);

    const modifiedKeys = simpleTransaction.keys.map(k => ({
      pubkey: k.pubkey,
      isSigner: false,
      isWritable: k.pubkey.equals(treasuryAccountKey) || k.pubkey.equals(proposer.publicKey)
    }));

    try {
      await program.methods.propose(
        SystemProgram.programId,
        modifiedKeys,
        simpleTransaction.data,
      )
        .accounts({
          multisig: multiSigAccountKey,
          proposer: approver.publicKey,
          proposition: propositionKey,
        })
        .signers([approver])
        .rpc({
          commitment: "confirmed"
        });

      assert.fail("Should not allow approver to create proposal");

    } catch (error) {
      // Log the full error for debugging
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  });

  it("should create proposal for user which contain multiple roles including proposal", async () => {
    const multisigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey);
    assert.exists(multisigAccount, "Multi Sig account should exist")

    // Transaction to propose
    const simpleTransaction = SystemProgram.transfer({
      fromPubkey: treasuryAccountKey,
      toPubkey: proposer.publicKey,
      lamports: 100000,
    });

    const [propositionKey] = PublicKey.findProgramAddressSync([
      Buffer.from("proposition"),
      multiSigAccountKey.toBytes(),
      Buffer.from([multisigAccount.transactionCount])
    ], program.programId);

    // const modifiedKeys = simpleTransaction.keys.map(k => ({
    //   pubkey: k.pubkey,
    //   isSigner: false,
    //   isWritable: true
    // }));

    await addBalance(otherUser.publicKey, LAMPORTS_PER_SOL)

    await program.methods.propose(
      SystemProgram.programId,
      // modifiedKeys,
      simpleTransaction.keys,
      simpleTransaction.data,
    )
      .accounts({
        multisig: multiSigAccountKey,
        proposer: otherUser.publicKey,
        proposition: propositionKey,
      })
      .signers([otherUser])
      .rpc({
        commitment: "confirmed"
      });

    const proposition = await program.account.proposition.fetch(propositionKey);
    assert.exists(proposition, "Proposition should be created");
    assert.equal(proposition.proposer.toString(), otherUser.publicKey.toString())
    assert.isEmpty(proposition.signers)
    assert.isFalse(proposition.didExecute, "didExecute should be false for newly created proposition")
    assert.deepEqual(proposition.data, simpleTransaction.data)
    // assert.deepEqual(proposition.accounts, modifiedKeys)
    assert.deepEqual(proposition.accounts, simpleTransaction.keys)
  })

  it("should not create proposal by random user", async () => {
    const multisigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey);
    assert.exists(multisigAccount, "Multi Sig account should exist")

    // Transaction to propose
    const simpleTransaction = SystemProgram.transfer({
      fromPubkey: treasuryAccountKey,
      toPubkey: randomUser.publicKey,
      lamports: 100000,
    });

    await addBalance(randomUser.publicKey, 0.1 * LAMPORTS_PER_SOL);

    const [propositionKey] = PublicKey.findProgramAddressSync([
      Buffer.from("proposition"),
      multiSigAccountKey.toBytes(),
      Buffer.from([multisigAccount.transactionCount])
    ], program.programId);

    const modifiedKeys = simpleTransaction.keys.map(k => ({
      pubkey: k.pubkey,
      isSigner: false,
      isWritable: true
    }));

    try {
      await program.methods.propose(
        SystemProgram.programId,
        modifiedKeys,
        simpleTransaction.data,
      )
        .accounts({
          multisig: multiSigAccountKey,
          proposer: randomUser.publicKey,
          proposition: propositionKey,
        })
        .signers([randomUser])
        .rpc({
          commitment: "confirmed"
        });

      assert.fail("Should not allow randomUser to create proposal");

    } catch (error) {
      // Log the full error for debugging
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  })
})
