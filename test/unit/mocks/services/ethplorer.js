jest.mock('@/services/cryptoData', () => {
  /* eslint-disable global-require */
  const {
    cryptoDataTransactions,
    cryptoDataHistory,
  } = require('fixtures/transactions');
  const { tokens } = require('fixtures/tokens');

  const { checksumAddress } = require('fixtures/accounts');

  return {
    getTransactions: jest.fn().mockResolvedValue(cryptoDataTransactions),

    getHistory: jest.fn().mockResolvedValue(cryptoDataHistory),

    getTransactionHistory: jest
      .fn()
      .mockResolvedValue([].concat(cryptoDataHistory, cryptoDataTransactions)),

    getInfo: jest.fn().mockResolvedValue([
      {
        id: '1',
        to: checksumAddress,
      },
    ]),

    tokenIsNotSpam: jest.fn().mockResolvedValue(true),

    getTokensWithBalance: jest.fn().mockResolvedValue(tokens),
  };
});
