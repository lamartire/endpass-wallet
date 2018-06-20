import storage from '@/services/storage';
import web3 from 'web3';
const { toBN, hexToNumberString, toWei, fromWei } = web3.utils;

export default {
  namespaced: true,
  state: {
    hdWallet: null,
    accounts: [],
    activeAccount: null,
    balance: null,
    pendingTransactions: [],
    // prettier-ignore
    availableCurrencies: ['USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR'],
    settings: {
      fiatCurrency: 'USD',
    },
  },
  getters: {
    isPublicAccount(state) {
      return state.activeAccount && state.activeAccount._privKey === null;
    },
    pendingBalance(state) {
      return state.pendingTransactions
        .filter(tnx => tnx.canseled === false)
        .map(tnx => {
          const { value, gasLimit, gasPrice } = tnx;
          const limit = hexToNumberString(gasLimit);
          const price = hexToNumberString(gasPrice);
          const gasCost = toBN(limit).mul(toBN(price));
          const tnxValue = tnx.token === 'ETH' ? toWei(value) : 0;

          return gasCost.add(toBN(tnxValue));
        })
        .reduce((total, item) =>  total.add(item), toBN(0))
        .toString();
    },
    balance(state, { pendingBalance }) {
      return toBN(state.balance || 0).sub(toBN(pendingBalance)).toString();
    },
  },
  mutations: {
    addAccount(state, account) {
      state.accounts.push(account)
    },
    setActiveAccount(state, account) {
      state.activeAccount = account;
    },
    // Set HD wallet that generates accounts
    setWallet(state, wallet) {
      // Do not set wallet if already exists
      if (state.hdWallet) {
        return
      }
      state.hdWallet = wallet
    },
    addTransaction(state, transaction) {
      state.pendingTransactions.push(transaction);
    },
    removeTransaction(state, trxHash) {
      let trxIndex = state.pendingTransactions.findIndex((trx) => {
        return trx.hash === trxHash;
      });
      if(state.pendingTransactions[trxIndex].canseled)
        return
      state.pendingTransactions.splice(trxIndex,1);
    },
    canselTransaction(state, trxHash) {
      let trxIndex = state.pendingTransactions.findIndex((trx) => {
        return trx.hash === trxHash;
      });
      state.pendingTransactions[trxIndex].canseled = true;
    },
    updateTransaction(state, updates) {
      let trxIndex = state.pendingTransactions.findIndex((trx) => {
        return trx.hash === updates.oldHash;
      });
      Object.assign(state.pendingTransactions[trxIndex], updates.newTrx);
    },
    setBalance(state, balance) {
      state.balance = balance;
    },
    setSettings(state, settings) {
      state.settings = JSON.parse(JSON.stringify(settings));
    },
  },
  actions: {
    addAccount({ commit, dispatch }, account) {
      commit('addAccount', account);
      return dispatch('setActiveAccount', account);
    },
    setActiveAccount({ commit, dispatch }, account) {
      commit('setActiveAccount', account);
      return Promise.all([
        dispatch('updateBalance'),
        dispatch('tokens/subscribeOnTokenUpdates',{}, {root: true})
      ]);
    },
    updateBalance({ state, commit, rootState }) {
      if (rootState.accounts.activeAccount) {
        const address = rootState.accounts.activeAccount.getAddressString();
        rootState.web3.web3.eth
          .getBalance(address)
          .then(balance => {
            state.pendingTransactions
              .filter(tnx => !tnx.canseled && tnx.status === 'success')
              .forEach(tnx => {
                commit('removeTransaction', tnx.hash);
              });

            commit('setBalance', balance);
          })
          .catch(e => {
            console.error(e, 'bal');
          });
      }
    },
    updateSettings({ commit }, settings) {
      commit('setSettings', settings);
      return storage.write('settings', settings);
    },
    init({ commit }) {
      return storage
        .read('settings')
        .then(settings => {
          if (settings) {
            commit('setSettings', settings);
          }
        })
        .catch(e => console.error(e));
    },
  }
}
