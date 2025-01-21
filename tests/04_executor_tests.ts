import { AccountMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { approver, executor, multiSigAccountKey, otherUser, program, proposer, treasuryAccountKey } from "./base";

// test cases for executor role.
describe("Execute of Proposal", async () => {
  let proposition: PublicKey;
  let propositionData;
  before(async () => {
    const propositions = await program.account.proposition.all();
    propositionData = propositions[0].account.proposalType.transfer
    proposition = propositions[0].publicKey
  })
  // 1. Try to execute a proposal which does not have complete amount of proposals
  it("should not execute proposal with less votes then threshold", async () => {
    try {
      await program.methods.execute().accounts({
        executor: executor.publicKey,
        proposition,
        multisig: multiSigAccountKey,
        treasury: treasuryAccountKey
      }).signers([executor]).rpc({
        commitment: "confirmed"
      })
      assert.fail("Should not execute a proposal as it does not have sufficient votes")
    } catch (error) {
      // Log the full error for debugging
      assert.include(
        error.message,
        "Required vote count is not met",
        "Expected vote count to be less then threshold"
      );
    }
  })
  // Add another approvel for other tests
  it("should approve proposal", async () => {
    await program.methods.approve(true).accounts({
      approver: otherUser.publicKey,
      proposition,
      multisig: multiSigAccountKey,
    }).signers([otherUser]).rpc({
      commitment: "confirmed"
    })
  })
  // 2. Execute a proposal with proposer role
  it("should not execute with proposer role", async () => {
    try {
      await program.methods.execute().accounts({
        executor: proposer.publicKey,
        proposition,
        multisig: multiSigAccountKey,
        treasury: treasuryAccountKey
      }).signers([proposer]).rpc({
        commitment: "confirmed"
      })
      assert.fail("Should not execute a proposal as it does not have sufficient votes")
    } catch (error) {
      // Log the full error for debugging
      assert.include(
        error.message,
        "User not authorized",
        "Expected user is not authorized error"
      );
    }
  })
  // 3. Execute with Approver role
  it("should not execute with approver role", async () => {
    try {
      await program.methods.execute().accounts({
        executor: approver.publicKey,
        proposition,
        multisig: multiSigAccountKey,
        treasury: treasuryAccountKey
      }).signers([approver]).rpc({
        commitment: "confirmed"
      })
      assert.fail("Should not execute a proposal as it does not have sufficient votes")
    } catch (error) {
      // Log the full error for debugging
      assert.include(
        error.message,
        "User not authorized",
        "Expected user is not authorized error"
      );
    }
  })

  // 4. Execute with Executor role
  it("should execute the proposal as it has correct vote count", async () => {
    const remainingAccounts: AccountMeta[] = []
    remainingAccounts.push({
      pubkey: treasuryAccountKey,
      isSigner: false,
      isWritable: true,
    })
    remainingAccounts.push({
      pubkey: propositionData.destination,
      isSigner: false,
      isWritable: true
    })
    remainingAccounts.push({
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    })
    const txSignature = await program.methods.execute().accounts({
      executor: executor.publicKey,
      proposition,
      multisig: multiSigAccountKey,
      treasury: treasuryAccountKey
    })
      .remainingAccounts(remainingAccounts)
      .signers([executor])
      .rpc({
        commitment: "confirmed",
        skipPreflight: true
      }).catch((error) => {
        console.log("Tranaasction error: ", error)
        throw error
      })

    console.log("Transaction Signature:", txSignature);

    const updatedProposition = await program.account.proposition.fetch(proposition);
    assert.isTrue(updatedProposition.didExecute, "It should have executed the transaction")
    // Check for the balance for which the transaction is happening
  })

  // 5. Try executing already executed proposal
  // 6. Try approving the already executed transaction
})
