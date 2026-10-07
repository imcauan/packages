import { BaseSchema, RequiredSchemaParams } from './schema';
import { ValidationPath } from './errors';

export type OneOfInput =
  | readonly [string, ...string[]]
  | Record<string, string>;

/**
 * Infers the allowed string union from tuple or object one-of values.
 */
export type OneOfOutput<TValues extends OneOfInput> =
  TValues extends readonly string[] ? TValues[number] : TValues[keyof TValues];

/**
 * Validates that input is one string from a fixed set of allowed values.
 */
export class OneOfSchema<TOutput extends string> extends BaseSchema<TOutput> {
  private readonly values: readonly string[];

  /**
   * Creates a one-of schema from normalized string values.
   */
  constructor(values: readonly string[], params: RequiredSchemaParams = {}) {
    super(params.requiredError);
    this.values = values;
  }

  protected parseDefined(input: unknown, path: ValidationPath) {
    if (typeof input !== 'string' || !this.isAllowedValue(input)) {
      return this.fail(
        path,
        'invalid_one_of',
        this.requiredError ?? 'invalid_one_of',
      );
    }

    return {
      success: true as const,
      data: input,
    };
  }

  protected clone(): OneOfSchema<TOutput> {
    const schema = new OneOfSchema<TOutput>(this.values, {
      requiredError: this.requiredError,
    });
    return this.copyBaseStateTo(schema);
  }

  private isAllowedValue(input: string): input is TOutput {
    return this.values.some(value => value === input);
  }
}
