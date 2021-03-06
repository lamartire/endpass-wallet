import EthWallet from 'ethereumjs-wallet';
import { toChecksumAddress, bytesToHex } from 'web3-utils';
import { get, mapKeys, isEmpty } from 'lodash';
import keystoreHDKeyVerify from '@endpass/utils/keystoreHDKeyVerify';
import keystoreHDWallet from '@endpass/utils/keystoreHDWallet';
import keystoreWallet from '@endpass/utils/keystoreWallet';
import Signer from '@endpass/class/Signer';
import {
  cryptoDataService,
  userService,
  localSettingsService,
} from '@/services';
import { Wallet, NotificationError, web3 } from '@/class';
import { ENCRYPT_OPTIONS } from '@/constants';
import {
  CHANGE_INIT_STATUS,
  SET_ADDRESS,
  ADD_WALLET,
  REMOVE_WALLETS,
  SET_HD_KEY,
  SET_BALANCE,
  SET_HD_CACHE_BY_TYPE,
} from './mutations-types';
import connect from '@/class/singleton/connect';

const WALLET_TYPES = Wallet.getTypes();
const WALLET_PROXY_TYPES = Wallet.getProxyTypes();

const selectWallet = async ({ commit, dispatch }, address) => {
  commit(SET_ADDRESS, toChecksumAddress(address));

  dispatch('updateBalance');
  dispatch('updateAccountSettings');
};

const addWallet = async ({ commit, dispatch }, json) => {
  try {
    const address = toChecksumAddress(json.address);
    const updatedJSON = { ...json, address };

    await userService.setAccount(address, updatedJSON);

    commit(ADD_WALLET, new Wallet(updatedJSON));
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

const addPublicWallet = async (
  { dispatch },
  { address: rawAddress, info: extraInfo },
) => {
  try {
    const address = toChecksumAddress(rawAddress);
    const info = {
      type: WALLET_TYPES.PUBLIC,
      hidden: false,
      ...extraInfo,
      address,
    };

    await dispatch('addWalletAndSelect', { info, address });
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const addWalletAndSelect = async ({ dispatch }, json) => {
  try {
    await dispatch('addWallet', json);
    await dispatch('selectWallet', toChecksumAddress(json.address));
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

// Import wallet from json V3 keystore
const addWalletWithV3 = async (
  { dispatch },
  { json, jsonPassword, walletPassword },
) => {
  try {
    const wallet = new Wallet(json);
    const privateKey = await wallet.getPrivateKeyString(jsonPassword);

    return dispatch('addWalletWithPrivateKey', {
      privateKey,
      password: walletPassword,
    });
  } catch (e) {
    if (!(e instanceof NotificationError)) {
      throw e;
    }

    return dispatch('errors/emitError', e, { root: true });
  }
};

const addWalletWithPrivateKey = async (
  { dispatch },
  { privateKey, password },
) => {
  try {
    const privateKeyString = Signer.privateKeyToStr(privateKey).replace(
      /^0x/,
      '',
    );
    const wallet = EthWallet.fromPrivateKey(
      Buffer.from(privateKeyString, 'hex'),
    );
    const v3KeyStore = keystoreWallet.encryptWallet(
      password,
      wallet,
      ENCRYPT_OPTIONS,
    );

    return dispatch('addWalletAndSelect', v3KeyStore);
  } catch (e) {
    return dispatch('errors/emitError', e, { root: true });
  }
};

const addWalletWithPublicKey = async ({ dispatch }, publicKeyOrAddress) => {
  // TODO convert public key to address, accept xPub key
  try {
    const address = toChecksumAddress(publicKeyOrAddress);
    const info = { type: WALLET_TYPES.PUBLIC };
    await dispatch('addWallet', { address, info });

    return dispatch('selectWallet', address);
  } catch (e) {
    return dispatch('errors/emitError', e, { root: true });
  }
};

const commitWallet = async ({ commit }, { wallet }) => {
  if (keystoreHDKeyVerify.isExtendedPublicKey(wallet.address)) {
    commit(SET_HD_KEY, wallet);
  } else {
    commit(ADD_WALLET, new Wallet(wallet));
  }
};

const saveWallet = async ({ dispatch }, { json, info = {} }) => {
  await userService.setAccount(json.address, { info, ...json });
  await dispatch('commitWallet', { wallet: json });
};

const generateNewWallet = async () => {
  const data = await connect.generateWallet();
  return data;
};

const createNewWallet = async ({ dispatch }) => {
  try {
    const generateData = await dispatch('generateNewWallet');
    const {
      info,
      encryptedSeed,
      v3KeystoreHdWallet,
      v3KeystoreChildWallet,
    } = generateData;

    // save data
    await dispatch('saveWallet', {
      json: v3KeystoreHdWallet,
      info,
    });
    await userService.backupSeed(encryptedSeed);
    await dispatch('addWalletAndSelect', v3KeystoreChildWallet);
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
    throw new Error("Can't create new wallet");
  }
};

const addNextWalletFromHd = async (
  { dispatch, getters },
  { password, walletType },
) => {
  const existAddresses = getters.accountV3WalletsAddresses;
  const nextAddresses = await dispatch('getNextWalletsFromHd', {
    offset: existAddresses.length,
    walletType,
  });
  const nextAddress = nextAddresses.find(
    address => !existAddresses.includes(address),
  );
  const nextAddressIdx =
    existAddresses.length + nextAddresses.indexOf(nextAddress);

  await dispatch('addHdChildWallets', {
    address: nextAddress,
    index: nextAddressIdx,
    type: walletType,
    password,
  });
};

const addHdChildWallets = async (
  { dispatch, getters },
  { type, password, address, index },
) => {
  try {
    const v3KeyStore = getters.cachedHdV3KeyStoreByType(type);
    const hdWallet = keystoreHDWallet.decryptHDWallet(password, v3KeyStore);
    const wallet = hdWallet.deriveChild(index).getWallet();

    if (address !== wallet.getChecksumAddressString()) {
      throw new NotificationError({
        title: 'Add wallet',
        text:
          'Something goes wrong with during new wallet adding. Please try again.',
        type: 'is-danger',
      });
    }

    const v3KeyStoreChild = wallet.toV3(Buffer.from(password), ENCRYPT_OPTIONS);
    dispatch('addWalletAndSelect', v3KeyStoreChild);
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

const addHdPublicWallet = async (
  { commit, dispatch, getters },
  { key, password },
) => {
  try {
    const hdWallet = getters.getHdWalletBySeed(key);
    const v3KeyStore = keystoreHDWallet.encryptHDWallet(
      password,
      hdWallet,
      ENCRYPT_OPTIONS,
    );
    const info = {
      address: v3KeyStore.address,
      type: WALLET_TYPES.HD_PUBLIC,
      hidden: false,
    };

    await userService.setAccount(v3KeyStore.address, {
      info,
      ...v3KeyStore,
    });

    commit(SET_HD_CACHE_BY_TYPE, {
      xpub: v3KeyStore.address,
      v3KeyStore,
      walletType: WALLET_TYPES.HD_PUBLIC,
    });
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const updateWallets = async ({ dispatch }, { wallets }) => {
  try {
    const { success } = await userService.updateAccounts(wallets);
    const promises = Object.values(wallets).map(wallet =>
      dispatch('commitWallet', { wallet }),
    );

    await Promise.all(promises);

    return success;
  } catch (error) {
    return dispatch('errors/emitError', error, { root: true });
  }
};

const getBalanceByAddress = async ({ rootGetters, rootState }, address) => {
  const { balance, tokens } = await cryptoDataService.getAccountBalance({
    network: rootGetters['web3/activeNetwork'],
    toSymbol: rootState.user.settings.fiatCurrency,
    address,
  });

  return {
    balance,
    tokens,
  };
};

const updateBalance = async ({ commit, dispatch, state }) => {
  if (!state.address) return;

  try {
    const { balance, tokens } = await dispatch(
      'getBalanceByAddress',
      state.address,
    );

    commit(SET_BALANCE, balance);
    dispatch(
      'tokens/setTokensInfoByAddress',
      {
        address: state.address,
        tokens,
      },
      {
        root: true,
      },
    );
  } catch (e) {
    dispatch('errors/emitError', e, { root: true });
  }
};

const validatePassword = async ({ state, getters }, password) => {
  if (getters.isPublicAccount || getters.isHardwareAccount) {
    const wallet = new Wallet(state.hdKey);

    return wallet.validatePassword(password);
  }

  return getters.wallet.validatePassword(password);
};

const setUserHdKey = async ({ commit, dispatch }) => {
  try {
    // Fetch and save HD wallet
    const hdKey = await userService.getHDKey();

    if (hdKey) {
      commit(SET_HD_KEY, hdKey);
      commit(SET_HD_CACHE_BY_TYPE, {
        xpub: hdKey.address,
        v3KeyStore: hdKey,
        walletType: WALLET_TYPES.HD_MAIN,
      });
    }
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const setUserWallets = async ({ commit, dispatch, rootState }) => {
  try {
    // Fetch and save regular accounts
    const accounts = await userService.getV3Accounts();

    if (isEmpty(accounts)) return;

    const localSettings = localSettingsService.load(rootState.user.email);
    const isAccountExist =
      localSettings &&
      localSettings.activeAccount &&
      accounts.find(({ address }) => address === localSettings.activeAccount);

    accounts.forEach(account => {
      commit(ADD_WALLET, new Wallet(account));
    });

    if (isAccountExist) {
      await dispatch('selectWallet', localSettings.activeAccount);
    } else {
      await dispatch('selectWallet', accounts[0].address);
    }
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const getNextWalletsFromHd = async (
  { state, dispatch, getters },
  { offset = 0, limit = 10, walletType },
) => {
  const savedXpub = getters.cachedXpubByType(walletType);
  const params = {
    xpub: savedXpub,
    walletType,
    offset,
    limit,
  };
  let proxyWallet;

  switch (walletType) {
    case WALLET_TYPES.TREZOR:
      proxyWallet = await Wallet.loadProxy(WALLET_PROXY_TYPES.TrezorProxy);
      break;
    case WALLET_TYPES.LEDGER:
      proxyWallet = await Wallet.loadProxy(WALLET_PROXY_TYPES.LedgerProxy);
      break;
    case WALLET_TYPES.HD_PUBLIC:
      proxyWallet = await Wallet.loadProxy(WALLET_PROXY_TYPES.HDProxy);
      break;
    case WALLET_TYPES.HD_MAIN:
      proxyWallet = await Wallet.loadProxy(WALLET_PROXY_TYPES.HDProxy);
      params.xpub = state.hdKey.address;
      break;
    default:
      throw new NotificationError({
        title: 'Access error',
        text:
          'An error occurred while getting access to hardware device. Please, try again.',
        type: 'is-danger',
      });
  }

  const result = await proxyWallet.getNextWallets(params);
  const { xpub, addresses } = result;

  if (savedXpub !== xpub) {
    await dispatch('saveToCache', { xpub, walletType });
  }

  return addresses;
};

const decryptAccountHdWallet = async ({ state }, password) => {
  if (!state.hdKey) {
    return null;
  }

  return keystoreHDWallet.decryptHDWallet(password, state.hdKey);
};

const decryptAccountWallets = async ({ state }, password) =>
  Object.values(state.wallets)
    .filter(item => !item.isPublic && !item.isHardware)
    .map(item => keystoreWallet.decryptWallet(password, item.v3));

const encryptHdWallet = async (ctx, { password, hdWallet }) => {
  if (!hdWallet) return null;

  return keystoreHDWallet.encryptHDWallet(password, hdWallet, ENCRYPT_OPTIONS);
};

const encryptWallets = async (ctx, { password, wallets = [] }) =>
  wallets.map(item =>
    keystoreWallet.encryptWallet(password, item, ENCRYPT_OPTIONS),
  );

const reencryptAllAccountWallets = async (
  { dispatch },
  { password, newPassword },
) => {
  const [hdWallet, decryptedWallets] = await Promise.all([
    dispatch('decryptAccountHdWallet', password),
    dispatch('decryptAccountWallets', password),
  ]);
  const encryptedHdWallet = await dispatch('encryptHdWallet', {
    password: newPassword,
    hdWallet,
  });
  const encryptedWallets = await dispatch('encryptWallets', {
    wallets: decryptedWallets,
    password: newPassword,
  });

  return {
    hdWallet: encryptedHdWallet,
    wallets: encryptedWallets,
  };
};

const updateWalletsWithNewPassword = async (
  { dispatch },
  { password, newPassword },
) => {
  const { hdWallet, wallets } = await dispatch('reencryptAllAccountWallets', {
    password,
    newPassword,
  });
  const walletsToUpdate = mapKeys(wallets, 'address');

  if (hdWallet) {
    Object.assign(walletsToUpdate, {
      [hdWallet.address]: hdWallet,
    });
  }

  if (isEmpty(walletsToUpdate)) {
    return null;
  }

  const res = await dispatch('updateWallets', {
    wallets: walletsToUpdate,
  });

  return res;
};

const recoverWalletsPassword = async (
  { state, dispatch, commit, getters },
  { seedPhrase, password },
) => {
  try {
    if (!state.hdKey) {
      throw new NotificationError({
        title: 'Error recovering wallet password',
        text: 'Main HD wallet not found.',
        type: 'is-danger',
      });
    }

    const hdWallet = getters.getHdWalletBySeed(seedPhrase);
    const hdWalletAddress = hdWallet.publicExtendedKey();

    if (state.hdKey.address !== hdWalletAddress) {
      throw new NotificationError({
        title: 'Error recovering wallet password',
        text: 'Incorrect seed phrase.',
        type: 'is-danger',
      });
    }

    const passwordRecoveryIdentifier = await userService.getPasswordRecoveryIdentifier();

    const wallet = hdWallet.deriveChild(0).getWallet();
    const privateKey = bytesToHex(wallet.getPrivateKey());
    const { signature } = await web3.eth.accounts.sign(
      passwordRecoveryIdentifier,
      privateKey,
    );
    const encryptedHdWallet = await dispatch('encryptHdWallet', {
      hdWallet,
      password,
    });
    const encryptedWallets = await dispatch('encryptWallets', {
      wallets: [wallet],
      password,
    });
    const { success } = await userService.recoverWalletsPassword({
      signature,
      main: {
        address: hdWalletAddress,
        keystore: encryptedHdWallet,
      },
      standart: {
        address: toChecksumAddress(bytesToHex(wallet.getAddress())),
        keystore: encryptedWallets[0],
      },
    });

    if (success) {
      const successMessage = new NotificationError({
        title: 'The password is successfully recovered',
        text:
          'All keystore wallets have been deleted. They can be restored from a private key or seed phrase on the import page.',
        type: 'is-success',
      });

      commit(REMOVE_WALLETS);
      await Promise.all([dispatch('setUserHdKey'), dispatch('setUserWallets')]);
      await dispatch('errors/emitError', successMessage, { root: true });
    }
  } catch (error) {
    await dispatch('errors/emitError', error, { root: true });
  }
};

const saveToCache = async ({ commit }, { xpub, walletType }) => {
  const info = { type: walletType };

  commit(SET_HD_CACHE_BY_TYPE, { xpub, walletType });

  await userService.setAccount(xpub, { info });
};

const updateAccountSettings = async ({
  state,
  rootGetters,
  rootState,
  dispatch,
}) => {
  const lastActiveAccount = rootGetters['user/lastActiveAccount'];
  const { address } = state;
  const wallet = get(state, `wallets[${address}]`, {});
  const isNotPublicAccount = wallet.isPublic === false;

  if (address !== lastActiveAccount && isNotPublicAccount) {
    await dispatch(
      'user/updateSettings',
      {
        lastActiveAccount: address,
      },
      { root: true },
    );
  }

  localSettingsService.save(rootState.user.email, {
    activeAccount: address,
  });
};

const backupSeed = async ({ dispatch }, { seed, password }) => {
  try {
    const hdWallet = await dispatch('decryptAccountHdWallet', password);
    const decryptedWallet = hdWallet.deriveChild(0).getWallet();
    const v3KeyStore = decryptedWallet.toV3(
      Buffer.from(password),
      ENCRYPT_OPTIONS,
    );
    const wallet = new Wallet(v3KeyStore);
    const encryptedSeed = await wallet.encryptMessageWithPublicKey(
      seed,
      password,
    );

    await userService.backupSeed(encryptedSeed);
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }
};

const recoverSeed = async ({ dispatch }, password) => {
  const hdWallet = await dispatch('decryptAccountHdWallet', password);
  const decryptedWallet = hdWallet.deriveChild(0).getWallet();
  const v3KeyStore = decryptedWallet.toV3(
    Buffer.from(password),
    ENCRYPT_OPTIONS,
  );
  const wallet = new Wallet(v3KeyStore);

  try {
    const encryptedSeed = await userService.recoverSeed();
    const recoveredSeed = await wallet.decryptMessageWithPrivateKey(
      encryptedSeed,
      password,
    );

    return recoveredSeed;
  } catch (err) {
    await dispatch('errors/emitError', err, { root: true });

    throw err;
  }
};

const init = async ({ commit, dispatch }) => {
  try {
    await Promise.all([dispatch('setUserHdKey'), dispatch('setUserWallets')]);
  } catch (e) {
    await dispatch('errors/emitError', e, { root: true });
  }

  commit(CHANGE_INIT_STATUS, true);
};

export default {
  selectWallet,
  addWallet,
  addWalletAndSelect,
  addWalletWithV3,
  addWalletWithPrivateKey,
  addWalletWithPublicKey,
  addPublicWallet,
  commitWallet,
  saveWallet,
  setUserHdKey,
  setUserWallets,
  generateNewWallet,
  createNewWallet,
  addHdPublicWallet,
  addNextWalletFromHd,
  addHdChildWallets,
  updateWallets,
  updateBalance,
  getBalanceByAddress,
  validatePassword,
  getNextWalletsFromHd,
  saveToCache,
  decryptAccountHdWallet,
  decryptAccountWallets,
  encryptHdWallet,
  encryptWallets,
  reencryptAllAccountWallets,
  updateWalletsWithNewPassword,
  recoverWalletsPassword,
  updateAccountSettings,
  backupSeed,
  recoverSeed,
  init,
};
