# Multi Sig Smart Contract

This smart contract can handle multi sig for any proposed transaction, for the maximum of 1KB data for the proposed transaction and 3 accounts.
This contract supports 4 Roles:

- Proposer: The user who can propose a transaction.
- Approver: The users who can approve a particular transaction.
- Executor: The users which can execute transactions once approved and the number of approves matches

### Work In Progress:

- [x] Functionality to create MultiSig account for a companyId
- [x] Test cases for init_project
- [x] Create Owner account for the user which initiates init_project
- [x] Test cases for Owner
- [x] Feature to add user
- [x] Test cases for add user
- [x] Feature to update user permission
- [x] Test cases for update user permission
- [x] Feature to remove the user from project
- [x] Test cases for removing user from project
- [x] Feature to update project threshold for Executor
- [x] Test cases for project threshold update
- [x] Feature to initiate proposal/transaction
- [x] Create Test Cases for propose transaction
- [x] Feature to Approve proposal/transaction
- [ ] Test cases for Approving proposal
- [x] Feature to Execute proposal/transaction
- [ ] Test cases for Executing proposal/transaction
