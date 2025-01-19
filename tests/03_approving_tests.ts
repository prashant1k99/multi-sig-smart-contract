import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert, expect } from "chai";
import { program, proposer, multiSigAccountKey, treasuryAccountKey, setup, approver, provider, otherUser, executor, randomUser } from './base';

describe("Approver Testing", () => {
  let proposition: PublicKey
  before(async () => {
    const propositions = await program.account.proposition.all();
    proposition = propositions[0].publicKey
  })

  it("should not approve a transaction with proposar account", async () => {
    try {
      await program.methods.approve(true).accounts({
        approver: proposer.publicKey,
        proposition,
        multisig: multiSigAccountKey,
      }).signers([proposer]).rpc({
        commitment: "confirmed"
      })
      assert.fail("Should not approve proposal with proposer roles")
    } catch (error) {
      // Log the full error for debugging
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  })

  it("should not approve a transaction with executor account", async () => {
    // Get one transaction from multisig
    // Try to approve this proposition with proposar account
    try {
      await program.methods.approve(true).accounts({
        approver: executor.publicKey,
        proposition,
        multisig: multiSigAccountKey,
      }).signers([executor]).rpc({
        commitment: "confirmed"
      })
      assert.fail("Should not approve proposal with executor roles")
    } catch (error) {
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  })

  it("should approve a transaction with valid account", async () => {
    await program.methods.approve(true).accounts({
      approver: approver.publicKey,
      proposition,
      multisig: multiSigAccountKey,
    }).signers([approver]).rpc({
      commitment: "confirmed"
    })

    const updatedProposition = await program.account.proposition.fetch(proposition)
    assert.equal(updatedProposition.signers.length, 1)
    assert.equal(updatedProposition.signers[0].key.toString(), approver.publicKey.toString())
  })

  it("should not approve proposal twice", async () => {
    try {
      await program.methods.approve(true).accounts({
        approver: approver.publicKey,
        proposition,
        multisig: multiSigAccountKey,
      }).signers([approver]).rpc({
        commitment: "confirmed"
      })

      assert.fail("should not approve same proposal twice for the same approver")
    } catch (error) {
      assert.include(
        error.message,
        "User has already voted",
        "Expected User already voted error"
      );
    }
  })

  it("should not approve by random user", async () => {
    try {
      await program.methods.approve(true).accounts({
        approver: randomUser.publicKey,
        proposition,
        multisig: multiSigAccountKey,
      }).signers([randomUser]).rpc({
        commitment: "confirmed"
      })
      assert.fail("Should not approve proposal by randomUser")
    } catch (error) {
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  })

  // TODO: Test for approval on already executed proposal after execution tests
})
