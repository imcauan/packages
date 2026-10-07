import { BooleanSchema } from './boolean.schema';
import { OneOfInput, OneOfOutput, OneOfSchema } from './one-of.schema';
import { NumberSchema, NumberSchemaApi } from './number.schema';
import { ObjectSchema, ObjectSchemaApi, ObjectShape } from './object.schema';
import { StringSchema, StringSchemaApi } from './string.schema';
import { RequiredSchemaParams, Schema } from './schema';

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function oneOfValues(values: OneOfInput): readonly string[] {
  return Array.isArray(values) ? values : Object.values(values);
}

type DomainStringParams = RequiredSchemaParams & {
  error: string;
};

/**
 * Validation schema builder facade used by applications.
 */
export const v = {
  /**
   * Builds an object schema from field schemas.
   */
  object<TShape extends ObjectShape>(shape: TShape): ObjectSchemaApi<TShape> {
    return new ObjectSchema(shape);
  },

  /**
   * Builds a string schema.
   */
  string(params: RequiredSchemaParams = {}): StringSchemaApi {
    return new StringSchema(params);
  },

  /**
   * Builds a number schema.
   */
  number(params: RequiredSchemaParams = {}): NumberSchemaApi {
    return new NumberSchema(params);
  },

  /**
   * Builds a boolean schema.
   */
  boolean(params: RequiredSchemaParams = {}): BooleanSchema {
    return new BooleanSchema(params);
  },

  /**
   * Builds a schema that accepts one string from a tuple or object of values.
   */
  oneOf<TValues extends OneOfInput>(
    values: TValues,
    params: RequiredSchemaParams = {},
  ): Schema<OneOfOutput<TValues>> {
    return new OneOfSchema<OneOfOutput<TValues>>(oneOfValues(values), params);
  },

  /**
   * Builds an email string schema.
   */
  email(params: DomainStringParams): StringSchemaApi {
    return new StringSchema({ requiredError: params.requiredError }).email({
      error: params.error,
    });
  },

  /**
   * Builds a URL string schema.
   */
  url(params: DomainStringParams): StringSchemaApi {
    return new StringSchema({ requiredError: params.requiredError }).url({
      error: params.error,
    });
  },

  /**
   * Builds a UUID string schema.
   */
  uuid(params: DomainStringParams): StringSchemaApi {
    return new StringSchema({ requiredError: params.requiredError }).regex({
      pattern:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      error: params.error,
    });
  },

  /**
   * Builds a strong password string schema.
   */
  password(params: DomainStringParams): StringSchemaApi {
    return new StringSchema({ requiredError: params.requiredError }).regex({
      pattern: strongPasswordRegex,
      error: params.error,
    });
  },

  /**
   * Environment-oriented schema helpers.
   */
  env: {
    /**
     * Builds a coerced TCP port schema with a default value.
     */
    port(defaultValue = 3000): Schema<number> {
      return new NumberSchema({ requiredError: 'invalid_port' })
        .coerce({ error: 'invalid_port' })
        .int({ error: 'invalid_port' })
        .min({ value: 1, error: 'invalid_port' })
        .max({ value: 65535, error: 'invalid_port' })
        .default(defaultValue);
    },

    /**
     * Builds a comma-separated environment variable schema.
     */
    csv(defaultValue = ''): Schema<string[]> {
      return new StringSchema()
        .transform(parseCsv)
        .default(parseCsv(defaultValue));
    },
  },
};
