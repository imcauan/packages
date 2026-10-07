import { BaseSchema, RequiredSchemaParams, Schema } from './schema';
import { ValidationIssue, ValidationPath } from './errors';

type NumberRule = (
  value: number,
  path: ValidationPath,
) => ValidationIssue | undefined;

type NumberRuleParams = {
  error: string;
};

type NumberValueRuleParams = NumberRuleParams & {
  value: number;
};

export interface NumberSchemaApi extends Schema<number> {
  coerce(params?: Partial<NumberRuleParams>): NumberSchemaApi;
  int(params: NumberRuleParams): NumberSchemaApi;
  min(params: NumberValueRuleParams): NumberSchemaApi;
  max(params: NumberValueRuleParams): NumberSchemaApi;
}

/**
 * Validates number input and supports numeric constraints.
 */
export class NumberSchema
  extends BaseSchema<number>
  implements NumberSchemaApi
{
  private readonly rules: NumberRule[] = [];
  private shouldCoerce = false;
  private coerceMessage?: string;

  constructor(params: RequiredSchemaParams = {}) {
    super(params.requiredError);
  }

  /**
   * Converts incoming values with `Number(...)` before validation.
   */
  coerce(params: Partial<NumberRuleParams> = {}): NumberSchema {
    const schema = this.clone();
    schema.shouldCoerce = true;
    schema.coerceMessage = params.error;
    return schema;
  }

  /**
   * Requires the number to be an integer.
   */
  int(params: NumberRuleParams): NumberSchema {
    return this.addRule((value, path) =>
      Number.isInteger(value)
        ? undefined
        : { path, code: 'invalid_integer', message: params.error },
    );
  }

  /**
   * Requires the number to be greater than or equal to `minimum`.
   */
  min({ value: minimum, error }: NumberValueRuleParams): NumberSchema {
    return this.addRule((value, path) =>
      value < minimum ? { path, code: 'too_small', message: error } : undefined,
    );
  }

  /**
   * Requires the number to be less than or equal to `maximum`.
   */
  max({ value: maximum, error }: NumberValueRuleParams): NumberSchema {
    return this.addRule((value, path) =>
      value > maximum ? { path, code: 'too_big', message: error } : undefined,
    );
  }

  protected override isMissing(input: unknown): boolean {
    return input === undefined || (this.shouldCoerce && input === '');
  }

  protected parseDefined(input: unknown, path: ValidationPath) {
    const value = this.shouldCoerce ? Number(input) : input;

    if (typeof value !== 'number' || Number.isNaN(value)) {
      return this.fail(
        path,
        'invalid_type',
        this.coerceMessage ?? this.requiredError ?? 'invalid_number',
      );
    }

    const failure = this.applyRules(value, path, this.rules);
    if (failure) {
      return failure;
    }

    return {
      success: true as const,
      data: value,
    };
  }

  protected clone(): NumberSchema {
    const schema = new NumberSchema({
      requiredError: this.requiredError,
    });
    schema.rules.push(...this.rules);
    schema.shouldCoerce = this.shouldCoerce;
    schema.coerceMessage = this.coerceMessage;
    return this.copyBaseStateTo(schema);
  }

  private addRule(rule: NumberRule): NumberSchema {
    const schema = this.clone();
    schema.rules.push(rule);
    return schema;
  }
}
