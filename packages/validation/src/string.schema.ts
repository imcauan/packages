import { BaseSchema, RequiredSchemaParams, Schema } from './schema';
import { ValidationIssue, ValidationPath } from './errors';
import { TransformSchema } from './transform.schema';

type StringRule = (
  value: string,
  path: ValidationPath,
) => ValidationIssue | undefined;

type StringRuleParams = {
  error: string;
};

type StringLengthRuleParams = StringRuleParams & {
  value: number;
};

type StringRegexRuleParams = StringRuleParams & {
  pattern: RegExp;
};

export interface StringSchemaApi extends Schema<string> {
  min(params: StringLengthRuleParams): StringSchemaApi;
  max(params: StringLengthRuleParams): StringSchemaApi;
  regex(params: StringRegexRuleParams): StringSchemaApi;
  email(params: StringRuleParams): StringSchemaApi;
  url(params: StringRuleParams): StringSchemaApi;
  transform<TNext>(transformer: (value: string) => TNext): Schema<TNext>;
  default(value: string): StringSchemaApi;
}

/**
 * Validates string input and supports string-specific rules.
 */
export class StringSchema
  extends BaseSchema<string>
  implements StringSchemaApi
{
  private readonly rules: StringRule[] = [];
  private fallback?: string;

  constructor(params: RequiredSchemaParams = {}) {
    super(params.requiredError);
  }

  /**
   * Requires the string to contain at least `length` characters.
   */
  min({ value: length, error }: StringLengthRuleParams): StringSchema {
    return this.addRule((value, path) =>
      value.length < length
        ? { path, code: 'too_small', message: error }
        : undefined,
    );
  }

  /**
   * Requires the string to contain at most `length` characters.
   */
  max({ value: length, error }: StringLengthRuleParams): StringSchema {
    return this.addRule((value, path) =>
      value.length > length
        ? { path, code: 'too_big', message: error }
        : undefined,
    );
  }

  /**
   * Requires the string to match `pattern`.
   */
  regex({ pattern, error }: StringRegexRuleParams): StringSchema {
    return this.addRule((value, path) =>
      pattern.test(value)
        ? undefined
        : { path, code: 'invalid_string', message: error },
    );
  }

  /**
   * Requires the string to be a valid email address.
   */
  email(params: StringRuleParams): StringSchema {
    return this.regex({
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      error: params.error,
    });
  }

  /**
   * Requires the string to be a valid URL.
   */
  url({ error }: StringRuleParams): StringSchema {
    return this.addRule((value, path) => {
      try {
        new URL(value);
        return undefined;
      } catch {
        return { path, code: 'invalid_url', message: error };
      }
    });
  }

  /**
   * Maps the validated string value to another output type.
   */
  transform<TNext>(
    transformer: (value: string) => TNext,
  ): TransformSchema<string, TNext> {
    return new TransformSchema(this.clone(), transformer);
  }

  override default(value: string): StringSchema {
    const schema = this.clone();
    schema.fallback = value;
    return schema;
  }

  override parseInternal(input: unknown, path: ValidationPath) {
    if (this.fallback !== undefined && this.isMissing(input)) {
      return {
        success: true as const,
        data: this.fallback,
      };
    }

    return super.parseInternal(input, path);
  }

  protected override isMissing(input: unknown): boolean {
    return input === undefined || input === '';
  }

  protected parseDefined(input: unknown, path: ValidationPath) {
    if (typeof input !== 'string') {
      return this.fail(
        path,
        'invalid_type',
        this.requiredError ?? 'invalid_string',
      );
    }

    const failure = this.applyRules(input, path, this.rules);
    if (failure) {
      return failure;
    }

    return {
      success: true as const,
      data: input,
    };
  }

  protected clone(): StringSchema {
    const schema = new StringSchema({
      requiredError: this.requiredError,
    });
    schema.rules.push(...this.rules);
    schema.fallback = this.fallback;
    this.copyBaseStateTo(schema);
    return schema;
  }

  private addRule(rule: StringRule): StringSchema {
    const schema = this.clone();
    schema.rules.push(rule);
    return schema;
  }
}
