import { ajv } from '@/class/singleton';

export const transactionSchema = {
  properties: {
    timestamp: {
      type: 'number',
    },
    from: {
      type: 'string',
      pattern: '^0x[a-zA-Z0-9]{40,}',
    },
    to: {
      type: 'string',
      pattern: '^0x[a-zA-Z0-9]{40,}',
    },
    hash: {
      type: 'string',
      pattern: '^0x[a-zA-Z0-9]{64,}',
    },
    value: {
      type: 'number',
      pattern: '[0-9]+',
      default: 0,
    },
    input: {
      type: 'string',
      pattern: '^0x[a-zA-Z0-9]+',
    },
    success: {
      type: 'boolean',
    },
  },
};

export const transactionsSchema = {
  type: 'array',
  items: transactionSchema,
};

export default {
  validateTransaction: ajv.compile(transactionSchema),
  validateTransactions: ajv.compile(transactionsSchema),
};
