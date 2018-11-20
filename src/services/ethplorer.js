import throttledQueue from 'throttled-queue';
import { http } from '@/class/singleton';
import { CRYPTODATA_API_URL } from '@/constants';
import { validate, balance, transactions } from '@/schema';

const throttle = throttledQueue(1, 5000);

const ethplorerService = {
  // Filter out spam balances of tokens
  tokenIsNotSpam(token) {
    return token && token.tokenInfo && token.tokenInfo.price;
  },

  getTokensWithBalance({ network, address }) {
    // `https://api.ethplorer.io/getAddressInfo/${address}`
    return new Promise((resolve, reject) => {
      throttle(() => {
        http
          .get(`${CRYPTODATA_API_URL}/balance/${network}/${address}/`, {
            params: {
              // apiKey: 'freekey',
              page: 1,
              limit: 50,
            },
          })
          .then(res => {
            console.log('balance', res);
            return validate(balance.validateBalance, res.data.tokens || []);
          })
          .then(res =>
            res
              .filter(ethplorerService.tokenIsNotSpam)
              .map(token => token.tokenInfo),
          )
          .catch(reject);
      });
    });
  },

  getHistory({ network, address }) {
    // `https://api.ethplorer.io/getAddressHistory/${address}`
    return new Promise((resolve, reject) => {
      throttle(() => {
        http
          .get(`${CRYPTODATA_API_URL}/transactions/${network}/${address}/`, {
            params: {
              // apiKey: 'freekey',
              page: 1,
              limit: 50,
            },
          })
          .then(res => {
            console.log('trans hist', res);
            return validate(
              transactions.validateTransactions,
              res.data.operations || [],
            );
          })
          .catch(reject);
      });
    });
  },

  getInfo({ network, address }) {
    // `https://api.ethplorer.io/getAddressTransactions/${address}/`
    return new Promise((resolve, reject) => {
      throttle(() => {
        http
          .get(
            `${CRYPTODATA_API_URL}/transactions/${network}/${address}/token`,
            {
              params: {
                // apiKey: 'freekey',
                page: 1,
                limit: 50,
              },
            },
          )
          .then(res => {
            console.log('trans info', res);
            return validate(transactions.validateTransactions, res.data);
          })
          .catch(reject);
      });
    });
  },

  // get tokens and ETH transactions
  getTransactionHistory(params) {
    return new Promise((resolve, reject) => {
      throttle(() => {
        Promise.all([this.getInfo(params), this.getHistory(params)])
          .then(res => {
            console.log('hist', res);
            // console.log('transactions history', transactions.concat(history));

            // res(transactions.concat(history));
          })
          .catch(reject);
      });
    });
  },
};

export default ethplorerService;
