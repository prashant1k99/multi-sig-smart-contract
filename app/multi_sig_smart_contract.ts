/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/multi_sig_smart_contract.json`.
 */
export type MultiSigSmartContract = {
  "address": "CyCee1ukFyDgRndFMW84d2nstCktbyUBzkpMVcHgX28d",
  "metadata": {
    "name": "multiSigSmartContract",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initializeProject",
      "discriminator": [
        69,
        126,
        215,
        37,
        20,
        60,
        73,
        235
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "companyId"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "companyId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "companyId",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "multiSigAccount",
      "discriminator": [
        77,
        179,
        91,
        145,
        94,
        229,
        133,
        46
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "customError",
      "msg": "Custom error message"
    }
  ],
  "types": [
    {
      "name": "multiSigAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "companyId",
            "type": "string"
          },
          {
            "name": "users",
            "type": {
              "vec": {
                "defined": {
                  "name": "userInfo"
                }
              }
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "treasuryBump",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "key",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "approverPosition",
      "type": "u8",
      "value": "1"
    },
    {
      "name": "executionerPosition",
      "type": "u8",
      "value": "2"
    },
    {
      "name": "ownerPosition",
      "type": "u8",
      "value": "3"
    },
    {
      "name": "proposerPosition",
      "type": "u8",
      "value": "0"
    },
    {
      "name": "seed",
      "type": "string",
      "value": "\"anchor\""
    }
  ]
};
