import { StandardSchemaProps, StandardSchemaResult } from './standard-schema';
import {
  ValidationError,
  ValidationIssue,
  ValidationPath,
  ValidationResult,
} from './errors';

/**
 * Infers the validated output type from a schema.
 */
export type Infer<TSchema> =
  TSchema extends Schema<infer TOutput> ? TOutput : never;

/**
 * Context passed to object-level checks for adding custom issues.
 */
export type CheckContext = {
  addIssue(issue: {
    path?: ValidationPath;
    code?: string;
    message: string;
  }): void;
};

/**
 * Public contract implemented by every validation schema.
 */
export interface Schema<TOutput> {
  readonly '~standard': StandardSchemaProps<unknown, TOutput>;
  /**
   * Validates input and throws `ValidationError` when invalid.
   */
  validate(input: unknown): TOutput;
  /**
   * Validates input without throwing.
   */
  safeValidate(input: unknown): ValidationResult<TOutput>;
  /**
   * Alias for `validate`, kept for schema interoperability.
   */
  parse(input: unknown): TOutput;
  /**
   * Alias for `safeValidate`, kept for schema interoperability.
   */
  safeParse(input: unknown): ValidationResult<TOutput>;
  /**
   * Allows `undefined` as a valid value.
   */
  optional(): Schema<TOutput | undefined>;
  /**
   * Uses `value` when the input is `undefined`.
   */
  default(
    value: Exclude<TOutput, undefined>,
  ): Schema<Exclude<TOutput, undefined>>;
}

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  issues: ValidationIssue[];
};

export type InternalResult<T> = ParseSuccess<T> | ParseFailure;

type Rule<T> = (value: T, path: ValidationPath) => ValidationIssue | undefined;

export type RequiredSchemaParams = {
  requiredError?: string;
};

function isRequiredFailure(result: ParseFailure): boolean {
  return (
    result.issues.length > 0 &&
    result.issues.every(issue => issue.code === 'required')
  );
}

function isDefined<T>(value: T): value is Exclude<T, undefined> {
  return value !== undefined;
}

/**
 * Base implementation for schema validation, defaults, optional values, and errors.
 */
export abstract class BaseSchema<TOutput> implements Schema<TOutput> {
  readonly '~standard': StandardSchemaProps<unknown, TOutput> = {
    version: 1,
    vendor: 'imcauan',
    validate: (value: unknown) => this.toStandardResult(value),
  };

  protected constructor(protected readonly requiredError?: string) {}

  /**
   * Validates input and returns the typed value or throws `ValidationError`.
   */
  validate(input: unknown): TOutput {
    const result = this.safeValidate(input);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  /**
   * Validates input and returns a success/error result.
   */
  safeValidate(input: unknown): ValidationResult<TOutput> {
    const result = this.parseInternal(input, []);
    if (!result.success) {
      const error = new ValidationError(result.issues);
      return {
        success: false,
        issues: result.issues,
        error,
      };
    }
    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Alias for `validate`, kept for schema interoperability.
   */
  parse(input: unknown): TOutput {
    return this.validate(input);
  }

  /**
   * Alias for `safeValidate`, kept for schema interoperability.
   */
  safeParse(input: unknown): ValidationResult<TOutput> {
    return this.safeValidate(input);
  }

  /**
   * Returns a schema that accepts `undefined`.
   */
  optional(): Schema<TOutput | undefined> {
    return new OptionalSchema(this);
  }

  /**
   * Returns a schema that substitutes `value` for `undefined` input.
   */
  default(
    value: Exclude<TOutput, undefined>,
  ): Schema<Exclude<TOutput, undefined>> {
    return new DefaultSchema(this, value);
  }

  parseInternal(input: unknown, path: ValidationPath): InternalResult<TOutput> {
    if (this.isMissing(input)) {
      return this.resolveMissingInput(path);
    }

    return this.parseDefined(input, path);
  }

  protected abstract parseDefined(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<TOutput>;

  protected abstract clone(): BaseSchema<TOutput>;

  protected isMissing(input: unknown): boolean {
    return input === undefined;
  }

  protected hasMissingValueHandler(): boolean {
    return false;
  }

  protected resolveMissingInput(path: ValidationPath): InternalResult<TOutput> {
    return this.fail(path, 'required', this.requiredError ?? 'required');
  }

  protected copyBaseStateTo<TSchema extends BaseSchema<unknown>>(
    schema: TSchema,
  ): TSchema {
    return schema;
  }

  protected fail(
    path: ValidationPath,
    code: string,
    message: string,
  ): ParseFailure {
    return {
      success: false,
      issues: [
        {
          path,
          code,
          message,
        },
      ],
    };
  }

  protected applyRules<TValue>(
    value: TValue,
    path: ValidationPath,
    rules: Array<Rule<TValue>>,
  ): ParseFailure | undefined {
    const issues = rules.flatMap(rule => {
      const issue = rule(value, path);
      return issue ? [issue] : [];
    });

    if (issues.length === 0) {
      return undefined;
    }

    return {
      success: false,
      issues,
    };
  }

  private toStandardResult(input: unknown): StandardSchemaResult<TOutput> {
    const result = this.safeValidate(input);
    if (result.success) {
      return {
        value: result.data,
      };
    }

    return {
      issues: result.issues.map(issue => ({
        message: issue.message,
        path: issue.path,
      })),
    };
  }
}

class OptionalSchema<TOutput> extends BaseSchema<TOutput | undefined> {
  constructor(private readonly source: BaseSchema<TOutput>) {
    super();
  }

  override parseInternal(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<TOutput | undefined> {
    const result = this.source.parseInternal(input, path);
    if (!result.success && isRequiredFailure(result)) {
      return {
        success: true,
        data: undefined,
      };
    }
    return result;
  }

  protected parseDefined(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<TOutput | undefined> {
    return this.parseInternal(input, path);
  }

  protected clone(): BaseSchema<TOutput | undefined> {
    return new OptionalSchema(this.source);
  }
}

class DefaultSchema<TOutput> extends BaseSchema<Exclude<TOutput, undefined>> {
  constructor(
    private readonly source: BaseSchema<TOutput>,
    private readonly defaultValue: Exclude<TOutput, undefined>,
  ) {
    super();
  }

  override parseInternal(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<Exclude<TOutput, undefined>> {
    const result = this.source.parseInternal(input, path);
    if (!result.success) {
      if (isRequiredFailure(result)) {
        return {
          success: true,
          data: this.defaultValue,
        };
      }
      return result;
    }

    return {
      success: true,
      data: isDefined(result.data) ? result.data : this.defaultValue,
    };
  }

  protected parseDefined(
    input: unknown,
    path: ValidationPath,
  ): InternalResult<Exclude<TOutput, undefined>> {
    return this.parseInternal(input, path);
  }

  protected clone(): BaseSchema<Exclude<TOutput, undefined>> {
    return new DefaultSchema(this.source, this.defaultValue);
  }
}

export function isSchema(value: unknown): value is BaseSchema<unknown> {
  return value instanceof BaseSchema;
}
