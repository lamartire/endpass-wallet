jest.mock('@/schema', () => ({
  cryptoDataValidator: {
    validateCryptoDataToken: jest.fn(data => data),
    validateCryptoDataTokens: jest.fn(data => data),
    validateCryptoDataTransaction: jest.fn(data => data),
    validateCryptoDataTransactions: jest.fn(data => data),
    validateCryptoDataBalance: jest.fn(data => data),
    validateCryptoDataSymbolPrice: jest.fn(data => data),
    validateCryptoDataSymbolPrices: jest.fn(data => data),
    validateCryptoDataGasPrice: jest.fn(data => data),
  },
  v3KeystoreValidator: {
    validateAddresses: jest.fn(data => data),
    validateAccount: jest.fn(data => data),
  },
  identityValidator: {
    validateUserToken: jest.fn(data => data),
    validateUserNetwork: jest.fn(data => data),
    validateUserSettings: jest.fn(data => data),
    validateUserOtpSetting: jest.fn(data => data),
  },
}));
