import { upperFirst } from 'lodash';
import { ajv } from '@/class/singleton';

import * as cryptoDataSchemas from './cryptoData';
import * as v3KeystoreSchemas from './v3Keystore';
import * as identitySchemas from './identity';

const makeValidator = schema => {
  const validator = ajv.compile(schema);

  return data => {
    if (!validator(data)) {
      /* eslint-disable no-console */
      console.warn('Schema validation error', data);

      if (!ENV.isProduction) {
        console.error(ajv.errorsText(validator));
      }
      /* eslint-enable no-console */
    }

    return data;
  };
};

const makeValidators = schemas =>
  Object.keys(schemas).reduce(
    (acc, key) =>
      Object.assign(acc, {
        [`validate${upperFirst(key)}`]: makeValidator(schemas[key]),
      }),
    {},
  );

export const cryptoDataValidator = makeValidators(cryptoDataSchemas);

export const v3KeystoreValidator = makeValidators(v3KeystoreSchemas);

export const identityValidator = makeValidators(identitySchemas);
