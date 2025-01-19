describe('All Tests', () => {
  // Specify order of execution for the tests
  require('./init_and_user_crud.ts');
  require('./proposer_tests.ts');
  require('./approving_tests.ts');
});
