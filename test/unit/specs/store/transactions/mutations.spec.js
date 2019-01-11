import state from '@/store/transactions';
import {
  ADD_TRANSACTION,
  UPDATE_TRANSACTION,
  SET_TRANSACTION_HISTORY,
} from '@/store/transactions/mutations-types';
import { cryptoDataTransactions } from 'fixtures/transactions';

const { mutations } = state;

describe('transactions  mutations', () => {
  let stateInstance;

  beforeEach(() => {
    stateInstance = {
      pendingTransactions: [],
      transactionHistory: [],
    };
  });

  describe('ADD_TRANSACTION', () => {
    it('should add transaction to pending transactions', () => {
      const [tx] = cryptoDataTransactions;

      mutations[ADD_TRANSACTION](stateInstance, tx);

      expect(stateInstance.pendingTransactions).toEqual([tx]);
    });
  });

  describe('UPDATE_TRANSACTION', () => {
    it('should update transaction with given data', () => {
      const [tx] = cryptoDataTransactions;

      stateInstance.pendingTransactions = [tx];
      mutations[UPDATE_TRANSACTION](stateInstance, {
        hash: tx.hash,
        payload: {
          success: false,
        },
      });

      expect(stateInstance.pendingTransactions).toEqual([
        {
          ...tx,
          success: false,
        },
      ]);
    });
  });

  describe('SET_TRANSACTION_HISTORY', () => {
    it('should set transaction history', () => {
      mutations[SET_TRANSACTION_HISTORY](stateInstance, [{}, {}]);

      expect(stateInstance.transactionHistory).toHaveLength(2);
    });

    it('should set an empty array with the nullable parameter', () => {
      mutations[SET_TRANSACTION_HISTORY](stateInstance, null);

      expect(stateInstance.transactionHistory).toEqual([]);
    });
  });
});
