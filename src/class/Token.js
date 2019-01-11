import web3 from 'web3';

const { toChecksumAddress } = web3.utils;

export default class Token {
  constructor({ address, logo, name, symbol, decimals = 18, balance = '0' }) {
    if (!address) {
      throw new Error("Token can't be created without address!");
    }

    this.decimals = parseInt(decimals, 10);
    this.logo = logo;
    this.name = name;
    this.symbol = symbol && symbol.toUpperCase();
    this.address = toChecksumAddress(address);
    this.balance = balance;
  }

  static getConsistent(token) {
    return {
      ...token,
      address: token.address.toLowerCase(),
    };
  }
}
