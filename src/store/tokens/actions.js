import { mapKeys, mapValues } from 'lodash';
import {
  SET_LOADING,
  SET_TOKENS_BY_ADDRESS,
  SET_BALANCES_BY_ADDRESS,
  ADD_NETWORK_TOKENS,
  ADD_TOKENS_PRICES,
  SET_USER_TOKENS,
} from './mutations-types';
import { NotificationError, Token } from '@/class';
import { tokenInfoService, cryptoDataService, userService } from '@/services';
import { mapArrayByProp } from '@endpass/utils/arrays';
import { MAIN_NET_ID } from '@/constants';

const init = async ({ dispatch }) => {
  await dispatch('getNetworkTokens');
};

const addUserToken = async (
  { commit, dispatch, getters, rootGetters },
  { token },
) => {
  try {
    const consistentToken = Token.getConsistent(token);

    if (getters.userTokenByAddress(consistentToken.address)) return;

    const net = rootGetters['web3/activeNetwork'];
    const updatedTokens = getters.userTokensWithToken({
      net,
      token: consistentToken,
    });

    await userService.addToken(net, consistentToken);

    commit(SET_USER_TOKENS, updatedTokens);
  } catch (err) {
    dispatch('errors/emitError', err, { root: true });
  }
};

const removeUserToken = async (
  { commit, getters, dispatch, rootGetters },
  { token },
) => {
  try {
    const consistentToken = Token.getConsistent(token);

    if (!getters.userTokenByAddress(consistentToken.address)) return;

    const netId = rootGetters['web3/activeNetwork'];
    const updatedTokens = getters.userTokensWithoutToken({
      net: netId,
      token: consistentToken,
    });
    const { address } = consistentToken;

    await userService.removeToken(netId, address);

    commit(SET_USER_TOKENS, updatedTokens);
  } catch (err) {
    dispatch('errors/emitError', err, { root: true });
  }
};

const getNetworkTokens = async ({ commit, dispatch, rootGetters }) => {
  const isMainNetwork = rootGetters['web3/activeNetwork'] === MAIN_NET_ID;

  if (!isMainNetwork) return;

  try {
    commit(SET_LOADING, true);

    const networkTokens = await tokenInfoService.getTokensList();

    commit(ADD_NETWORK_TOKENS, mapArrayByProp(networkTokens, 'address'));
  } catch (e) {
    const error = new NotificationError({
      title: 'Failed to get list of tokens',
      text:
        'An error occurred while retrieving the list of tokens. Please try again.',
      type: 'is-warning',
    });
    dispatch('errors/emitError', error, { root: true });
  } finally {
    commit(SET_LOADING, false);
  }
};

const getTokensPrices = async ({ commit, getters }, { tokensSymbols }) => {
  if (tokensSymbols.length === 0) return;

  try {
    const prices = await cryptoDataService.getSymbolsPrice(
      tokensSymbols,
      getters.activeCurrencyName,
    );

    commit(ADD_TOKENS_PRICES, prices);
  } catch (err) {}
};

const setFullTokensByAddress = async ({ commit }, { address, tokens }) => {
  const tokensByAddress = mapKeys(tokens, 'address');

  commit(SET_TOKENS_BY_ADDRESS, {
    tokens: Object.keys(tokensByAddress),
    address,
  });
  commit(SET_BALANCES_BY_ADDRESS, {
    balances: mapValues(tokensByAddress, token => token.balance),
    address,
  });
  commit(ADD_TOKENS_PRICES, mapValues(tokensByAddress, token => token.price));
};

export default {
  init,
  addUserToken,
  removeUserToken,
  getNetworkTokens,
  getTokensPrices,
  setFullTokensByAddress,
};
