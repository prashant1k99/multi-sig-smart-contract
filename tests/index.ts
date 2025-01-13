describe('All Tests', () => {
  require('./init_and_user_crud.ts');  // This will run first
  require('./proposer_tests.ts');         // This will run second
});
