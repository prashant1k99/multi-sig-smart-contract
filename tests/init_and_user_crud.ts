import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { MultiSigSmartContract as MultiSig } from "../target/types/multi_sig_smart_contract";

enum Roles {
  PROPOSER,
  APPROVER,
  EXECUTOR,
  OWNER
}

const checkRole = (role: number, forRole: Roles): boolean => {
  return (role & (1 << forRole)) !== 0;
}


describe("mult sig init and add user", () => {
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
  const otherUser = Keypair.generate()

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
      otherUser.publicKey,
      Buffer.from([Roles.PROPOSER, Roles.APPROVER, Roles.EXECUTOR])
    ).accounts({
      multisig: multiSigAccountKey
    }).rpc({
      commitment: "confirmed",
    });

    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)

    const userExists = multiSigAccount.users.some(user => user.key.toString() == otherUser.publicKey.toString())
    assert.isTrue(userExists, "Added user should exist in multiSigAccount")
    const addedUser = multiSigAccount.users.find(
      user => user.key.toString() === otherUser.publicKey.toString()
    );
    assert.isTrue(checkRole(Number(addedUser.roles), Roles.PROPOSER), "User should have proposer role");
    assert.isTrue(checkRole(Number(addedUser.roles), Roles.APPROVER), "User should have approver role");
    assert.isTrue(checkRole(Number(addedUser.roles), Roles.EXECUTOR), "User should have executor role");
    assert.isFalse(checkRole(Number(addedUser.roles), Roles.OWNER), "User should not have owner role")
  })

  it("Should not add same user again", async () => {
    try {
      await program.methods.addUser(
        otherUser.publicKey,
        Buffer.from([Roles.PROPOSER])
      ).accounts({
        multisig: multiSigAccountKey
      }).rpc({
        commitment: "confirmed",
      });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(
        error.message,
        "UserAlreadyExists",
        "Expected UserAlreadyExists error"
      );
    }
  });

  it("should not allow non owner to add other user", async () => {
    const randomUser = Keypair.generate();
    const anotherRandomUser = Keypair.generate();
    const tx = await provider.connection.requestAirdrop(randomUser.publicKey, 0.01 * LAMPORTS_PER_SOL)
    await provider.connection.confirmTransaction(tx, "confirmed");
    console.log("Random User Balance: ", await provider.connection.getBalance(randomUser.publicKey))
    try {
      await program.methods.addUser(
        anotherRandomUser.publicKey,
        Buffer.from([Roles.PROPOSER]) // Proposer Role
      ).accounts({
        multisig: multiSigAccountKey,
        signer: randomUser.publicKey
      }).signers([randomUser]).rpc({
        commitment: "confirmed",
      });
      assert.fail("Should not allow any random user to add user")
    } catch (error) {
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  })

  it("should not allow non owner to add user", async () => {
    const tx = await provider.connection.requestAirdrop(otherUser.publicKey, 0.01 * LAMPORTS_PER_SOL)
    await provider.connection.confirmTransaction(tx, "confirmed");

    console.log("Proposer User Balance: ", otherUser.publicKey.toString(), await provider.connection.getBalance(otherUser.publicKey))

    const randomUser = Keypair.generate();
    try {
      await program.methods.addUser(
        randomUser.publicKey,
        Buffer.from([Roles.PROPOSER]) // Proposer Role
      ).accounts({
        multisig: multiSigAccountKey,
        signer: otherUser.publicKey,
      }).signers([otherUser]).rpc({
        commitment: "confirmed",
      });

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(
        error.message,
        "User not authorized",
        "Expected User not authorized error"
      );
    }
  })

  it("should update permissions", async () => {
    await program.methods.updatePermission(
      otherUser.publicKey, Buffer.from([Roles.PROPOSER, Roles.APPROVER]) // Proposer Role
    ).accounts({
      multisig: multiSigAccountKey
    }).rpc({
      commitment: "confirmed"
    })

    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)

    const userExists = multiSigAccount.users.some(user => user.key.toString() == otherUser.publicKey.toString())
    assert.isTrue(userExists, "Added user should exist in multiSigAccount")
    const addedUser = multiSigAccount.users.find(
      user => user.key.toString() === otherUser.publicKey.toString()
    );
    assert.isTrue(checkRole(Number(addedUser.roles), Roles.PROPOSER), "User should have proposer role");
    assert.isTrue(checkRole(Number(addedUser.roles), Roles.APPROVER), "User should have approver role");
    assert.isFalse(checkRole(Number(addedUser.roles), Roles.EXECUTOR), "User should not have executor role");
    assert.isFalse(checkRole(Number(addedUser.roles), Roles.OWNER), "User should not have owner role")
  })

  it("should remove user", async () => {
    const randomUser = Keypair.generate();
    await program.methods.addUser(
      randomUser.publicKey,
      Buffer.from([Roles.APPROVER, Roles.EXECUTOR])
    ).accounts({
      multisig: multiSigAccountKey
    }).rpc({
      commitment: "confirmed"
    })

    await program.methods.removeUser(
      randomUser.publicKey
    ).accounts({
      multisig: multiSigAccountKey
    }).rpc({
      commitment: "confirmed"
    })

    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)

    const userExists = multiSigAccount.users.some(user => user.key.toString() == randomUser.publicKey.toString())
    assert.isFalse(userExists, "Added user should not exist in multiSigAccount")
  })
});
