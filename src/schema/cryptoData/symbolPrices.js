const symbolRegex = '^.+$';

export const cryptoDataSymbolPrice = {
  type: 'object',
  maxProperties: 1,
  minProperties: 1,
  patternProperties: {
    [symbolRegex]: { type: 'number' },
  },
  propertyNames: {
    pattern: symbolRegex,
  },
};

export const cryptoDataSymbolPrices = {
  oneOf: [
    cryptoDataSymbolPrice,
    {
      type: 'object',
      minProperties: 1,
      patternProperties: {
        [symbolRegex]: cryptoDataSymbolPrice,
      },
      propertyNames: {
        pattern: symbolRegex,
      },
    },
  ],
};
