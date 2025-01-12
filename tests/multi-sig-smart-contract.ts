import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import {
  BanksClient,
  ProgramTestContext,
  startAnchor,
} from "solana-bankrun";
import { MultiSig, MultiSigIDL as IDL, getMultiSigProgram } from "../app";

describe("multi-sig-smart-contract", () => {
  // Configure the client to use the local cluster.

  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: Program<MultiSig>;
  let banksClient: BanksClient;
  let owner: Keypair;

  before(async () => {
    context = await startAnchor(
      "",
      [
        {
          name: IDL.metadata.name,
          programId: new PublicKey(IDL.address),
        },
      ],
      [],
    );

    provider = new BankrunProvider(context);

    program = new Program<MultiSig>(IDL as MultiSig);

    anchor.setProvider(provider);

    banksClient = context.banksClient;

    owner = provider.wallet.payer;
  })

  it("Should create MultiSig", () => {
    // Write test case for creating a multi sig account
  })
});
