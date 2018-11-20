import { ajv } from '@/class/singleton';
import { tokensSchema } from './tokens';

export const balanceSchema = {
  additionalProperties: false,
  required: ['balance', 'tokens'],
  properties: {
    balance: {
      type: 'number',
    },
    tokens: tokensSchema,
  },
};

export default {
  validateBalance: ajv.compile(balanceSchema),
};
