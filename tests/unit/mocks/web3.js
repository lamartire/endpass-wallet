import Web3 from 'web3';

jest.mock('web3', () => {
  class Contract {
    constructor(abi, address) {
      this.address = address;
      this.abi = abi;
    }
  }

  const originalWeb3 = require.requireActual('web3');
  // eslint-disable-next-line global-require
  const { transactionHash } = require('fixtures/transactions');
  const setProvider = jest.fn(() => true);
  const currentProvider = {
    destroy: jest.fn(),
    send: jest.fn(),
    sendAsync: jest.fn(),
  };
  const sendEvent = {
    on: jest.fn(),
    then: jest.fn(cb =>
      cb({
        transactionHash,
      }),
    ),
  };
  let subscriptions = {};
  const subscriptionEventEmiter = {
    on: jest.fn((type, callback) => {
      if (!subscriptions[type]) {
        subscriptions[type] = [];
      }

      subscriptions[type].push(callback);

      return subscriptionEventEmiter;
    }),
    emit: jest.fn((type, data) => {
      if (!subscriptions[type]) {
        return;
      }

      subscriptions[type].forEach(callback => callback(data));

      /* eslint-disable-next-line */
      return subscriptionEventEmiter;
    }),
  };
  const subscribe = jest.fn(() => subscriptionEventEmiter);
  const clearSubscriptions = jest.fn(() => {
    subscriptions = {};
  });
  const eth = {
    net: {
      getNetworkType: jest.fn().mockResolvedValue('ropsten'),
      getId: jest.fn().mockResolvedValue(3),
    },
    estimateGas: jest.fn(),
    accounts: {
      sign: jest.fn().mockResolvedValue({
        signature: 'signature',
      }),
    },
    Contract,
    sendSignedTransaction: jest.fn(() => sendEvent),
    getBalance: jest.fn().mockResolvedValue('1'),
    getBlockNumber: jest.fn().mockResolvedValue(),
    getBlock: jest.fn().mockResolvedValue({}),
    getTransactionCount: jest.fn().mockResolvedValue(),
    getTransactionReceipt: jest.fn().mockResolvedValue({}),
    getCode: jest.fn().mockResolvedValue('0x0123'),
    subscribe,
    clearSubscriptions,
    subscriptionEventEmiter,
    isSyncing: jest.fn().mockResolvedValue(false),
  };
  const { utils } = originalWeb3;
  const mockWeb3 = jest.fn(() => ({
    setProvider,
    currentProvider,
    eth,
    utils,
    sendEvent,
  }));

  const {
    WebsocketProvider,
    HttpProvider,
    IpcProvider,
  } = originalWeb3.providers;
  WebsocketProvider.prototype.send = jest.fn();
  WebsocketProvider.prototype.sendAsync = jest.fn();
  HttpProvider.prototype.send = jest.fn();
  HttpProvider.prototype.sendAsync = jest.fn();
  IpcProvider.prototype.send = jest.fn();
  IpcProvider.prototype.sendAsync = jest.fn();

  mockWeb3.providers = {
    HttpProvider,
    WebsocketProvider,
    IpcProvider,
  };

  // Allows you to replace stubs of web3 instance methods in unit tests
  mockWeb3.setProvider = setProvider;
  mockWeb3.sendEvent = sendEvent;
  mockWeb3.currentProvider = currentProvider;
  mockWeb3.eth = eth;
  mockWeb3.utils = utils;

  return mockWeb3;
});

export default Web3;
