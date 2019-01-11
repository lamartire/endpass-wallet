jest.mock('@/services/cryptoData', () => {
  /* eslint-disable global-require */
  const {
    cryptoDataTransactions,
    cryptoDataHistory,
  } = require('fixtures/transactions');
  const { tokens } = require('fixtures/tokens');
  const { priceMulti } = require('fixtures/price');
  const { gasPrice } = require('fixtures/gasPrice');
  const { checksumAddress } = require('fixtures/accounts');

  return {
    getSymbolsPrice: jest.fn().mockResolvedValue(priceMulti),

    getGasPrice: jest.fn().mockResolvedValue(gasPrice),

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
