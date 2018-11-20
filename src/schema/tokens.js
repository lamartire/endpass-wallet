import { ajv } from '@/class/singleton';

export const tokenSchema = {
  properties: {
    name: {
      type: 'string',
    },
    symbol: {
      type: 'string',
    },
    balance: {
      type: 'string',
      pattern: '[0-9]+',
    },
  },
};

export const tokensSchema = {
  type: 'array',
  items: tokenSchema,
};

export default {
  validateToken: ajv.compile(tokenSchema),
  validateTokens: ajv.compile(tokensSchema),
};
