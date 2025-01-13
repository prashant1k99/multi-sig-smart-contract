import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { provider, program, payer, proposer, companyID, multiSigAccountKey, treasuryAccountKey, setup } from './base';

describe("should test proposers", () => {
  before(() => {
    setup()
  })

  it("check for existing user", async () => {
    const multiSigAccount = await program.account.multiSigAccount.fetch(multiSigAccountKey)
    console.log(multiSigAccount)
  })
})
