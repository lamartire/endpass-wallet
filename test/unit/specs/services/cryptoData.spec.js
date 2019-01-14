import MockAdapter from 'axios-mock-adapter';
import { http } from '@/class/singleton';
import { NotificationError } from '@/class';
import { cryptoDataValidator } from '@/schema';
import { gasPrice } from 'fixtures/gasPrice';
import { price, priceMulti } from 'fixtures/price';
import { address } from 'fixtures/accounts';

const cryptoDataService = require.requireActual('@/services/cryptoData')
  .default;

describe('Crypto data service', () => {
  const apiUrl = 'https://api.cryptoData.io';
  let axiosMock;

  beforeEach(() => {
    axiosMock = new MockAdapter(http);
  });

  afterEach(() => {
    axiosMock.reset();
  });

  describe('getSymbolsPrice', () => {
    const requestUrl = `${ENV.cryptoDataAPIUrl}/price`;
    const fromSymbols = ['ETH', 'BTC'];
    const toSymbol = 'USD';
    const priceMultiResponse = priceMulti;
    const priceResponse = price;

    it('should correctly convert symbols to EHT-TEST', async () => {
      expect.assertions(2);

      const toSymbol = 'ETH-TEST';
      const expectedResponse = {
        ETH: { [toSymbol]: 0 },
        BTC: { [toSymbol]: 0 },
      };

      axiosMock.onGet(requestUrl).reply(200, priceMultiResponse);

      const receivedResponse = await cryptoDataService.getSymbolsPrice(
        fromSymbols,
        toSymbol,
      );

      expect(receivedResponse).toEqual(expectedResponse);
      expect(axiosMock.history.get).toHaveLength(0);
    });

    it('should correctly convert EHT-TEST to symbol', async () => {
      expect.assertions(2);

      const fromSymbols = 'ETH-TEST';
      const expectedResponse = { [toSymbol]: 0 };

      axiosMock.onGet(requestUrl).reply(200, priceMultiResponse);

      const receivedResponse = await cryptoDataService.getSymbolsPrice(
        fromSymbols,
        toSymbol,
      );

      expect(receivedResponse).toEqual(expectedResponse);
      expect(axiosMock.history.get).toHaveLength(0);
    });

    it('should make correct request for one symbol', async () => {
      expect.assertions(2);

      axiosMock.onGet(requestUrl).reply(config => {
        expect(config.url).toBe(requestUrl);
        expect(config.params).toEqual({
          from: fromSymbols[0],
          to: toSymbol,
        });
        return [200, priceResponse];
      });

      await cryptoDataService.getSymbolsPrice(fromSymbols[0], toSymbol);
    });

    it('should make correct request for many symbols', async () => {
      expect.assertions(2);

      axiosMock.onGet(requestUrl).reply(config => {
        expect(config.url).toBe(requestUrl);
        expect(config.params).toEqual({
          from: fromSymbols.join(','),
          to: toSymbol,
        });
        return [200, priceMultiResponse];
      });

      await cryptoDataService.getSymbolsPrice(fromSymbols, toSymbol);
    });

    it('should handle successful GET /price request', async () => {
      expect.assertions(1);

      axiosMock.onGet(requestUrl).reply(200, priceMultiResponse);

      const response = await cryptoDataService.getSymbolsPrice(
        fromSymbols,
        toSymbol,
      );

      expect(response).toEqual(priceMultiResponse);
    });

    it('should handle rejected GET /price request', async () => {
      expect.assertions(1);

      axiosMock.onGet(requestUrl).reply(500);

      await expect(
        cryptoDataService.getSymbolsPrice(fromSymbols, toSymbol),
      ).rejects.toThrow(expect.any(Error));
    });

    it('should handle data validation errors', async () => {
      expect.assertions(2);

      const symbolPriceValidationError = new Error(
        'symbolPriceValidationError',
      );
      const symbolsPriceValidationError = new Error(
        'symbolsPriceValidationError',
      );

      axiosMock.onGet(requestUrl).reply(200);
      cryptoDataValidator.validateCryptoDataSymbolPrices.mockImplementationOnce(
        () => {
          throw symbolPriceValidationError;
        },
      );
      cryptoDataValidator.validateCryptoDataSymbolPrices.mockImplementationOnce(
        () => {
          throw symbolsPriceValidationError;
        },
      );

      await expect(
        cryptoDataService.getSymbolsPrice(fromSymbols[0], toSymbol),
      ).rejects.toThrow(symbolPriceValidationError);

      await expect(
        cryptoDataService.getSymbolsPrice(fromSymbols, toSymbol),
      ).rejects.toThrow(symbolsPriceValidationError);
    });
  });

  describe('getGasPrice', () => {
    const requestUrl = `${ENV.cryptoDataAPIUrl}/gas/price`;
    const expectedError = new NotificationError({
      title: 'Failed to get suggested gas price',
      text:
        'An error occurred while retrieving suggested gas price. Please, set manually or, try again.',
      type: 'is-warning',
    });

    it('should make correct request', async () => {
      expect.assertions(1);

      axiosMock.onGet(requestUrl).reply(config => {
        expect(config.url).toBe(requestUrl);
        return [200, gasPrice];
      });

      await cryptoDataService.getGasPrice();
    });

    it('should handle successful GET /gas/price request', () => {
      axiosMock.onGet(`${ENV.cryptoDataAPIUrl}/gas/price`).reply(200, gasPrice);

      expect(cryptoDataService.getGasPrice()).resolves.toEqual(gasPrice);
    });

    it('should handle data validation errors', async () => {
      expect.assertions(1);

      const gasPriceValidationError = new Error('gasPriceValidationError');

      axiosMock.onGet(requestUrl).reply(200);
      cryptoDataValidator.validateGasPrice.mockImplementationOnce(() => {
        throw gasPriceValidationError;
      });

      await expect(cryptoDataService.getGasPrice()).rejects.toThrow(
        expectedError,
      );
    });

    it('should handle rejected GET /price request', async () => {
      expect.assertions(1);

      axiosMock.onGet(requestUrl).reply(500);

      await expect(cryptoDataService.getGasPrice()).rejects.toThrow(
        expectedError,
      );
    });
  });

  describe('getTokensWithBalance', () => {
    const url = `${apiUrl}/getAddressInfo/${address}`;

    const successTokenResp = {
      tokens: [
        {
          tokenInfo: {
            price: '0',
          },
        },
        {
          tokenInfo: {
            price: '0',
          },
        },
      ],
    };

    // TODO: вернуть
    // it('should make correct request', () => {
    //   expect.assertions(2);
    //   axiosMock.onGet(url).reply(config => {
    //     console.log(config);
    //     expect(config.method).toBe('get');
    //     expect(config.url).toBe(url);

    //     return [200, successTokenResp];
    //   });
    // });

    it('should handle successfull request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(200, successTokenResp);
      const result = await cryptoDataService.getTokensWithBalance(address);

      expect(result).toHaveLength(2);
    });

    it('should return empty array with failed request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(200, { success: false });
      const result = await cryptoDataService.getTokensWithBalance(address);

      expect(result).toEqual([]);
    });

    it('should throw exception with rejected request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(500, {});

      await expect(
        cryptoDataService.getTokensWithBalance(address),
      ).rejects.toThrow();
    });
  });

  describe('getHistory', () => {
    const { getHistory } = cryptoDataService;
    const url = `${apiUrl}/getAddressHistory/${address}`;

    const successResp = {
      operations: [{}, {}],
    };

    it('should make correct request', async () => {
      expect.assertions(2);
      axiosMock.onGet(url).reply(config => {
        expect(config.method).toBe('get');
        expect(config.url).toBe(url);

        return [200, successResp];
      });

      await getHistory(address);
    });

    it('should handle successfull request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(200, successResp);
      const result = await getHistory(address);

      expect(result).toHaveLength(2);
    });

    it('should return empty array with failed request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(200, { success: false });
      const result = await getHistory(address);

      expect(result).toEqual([]);
    });

    it('should throw exception with rejected request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(500, {});

      await expect(getHistory(address)).rejects.toThrow();
    });
  });

  describe('getInfo', () => {
    const { getInfo } = cryptoDataService;
    const url = `${apiUrl}/getAddressTransactions/${address}`;

    const successResp = [{}, {}];

    it('should make correct request', async () => {
      expect.assertions(2);
      axiosMock.onGet(url).reply(config => {
        expect(config.method).toBe('get');
        expect(config.url).toBe(url);

        return [200, successResp];
      });

      await getInfo(address);
    });

    it('should handle successfull request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(200, successResp);
      const result = await getInfo(address);

      expect(result).toHaveLength(2);
    });

    it('should return empty array with failed request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(200, undefined);
      const result = await getInfo(address);

      expect(result).toEqual([]);
    });

    it('should throw exception with rejected request', async () => {
      expect.assertions(1);
      axiosMock.onGet(url).reply(500, {});

      await expect(getInfo(address)).rejects.toThrow();
    });
  });
});
