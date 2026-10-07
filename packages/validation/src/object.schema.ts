import { BaseSchema, CheckContext, Infer, isSchema, Schema } from './schema';
import { ValidationIssue, ValidationPath } from './errors';

export type ObjectShape = Record<string, Schema<unknown>>;

export type InferObject<TShape extends ObjectShape> = {
  [TKey in keyof TShape]: Infer<TShape[TKey]>;
};

type ObjectCheck<TOutput> = (value: TOutput, context: CheckContext) => void;

export interface ObjectSchemaApi<TShape extends ObjectShape> extends Schema<
  InferObject<TShape>
> {
  check(check: ObjectCheck<InferObject<TShape>>): ObjectSchemaApi<TShape>;
  extend<TExtension extends ObjectShape>(
    extension: TExtension,
  ): ObjectSchemaApi<TShape & TExtension>;
}

/**
 * Validates object input field-by-field and supports object-level checks.
 */
export class ObjectSchema<TShape extends ObjectShape>
  extends BaseSchema<InferObject<TShape>>
  implements ObjectSchemaApi<TShape>
{
  private readonly checks: Array<ObjectCheck<InferObject<TShape>>> = [];

  constructor(readonly shape: TShape) {
    super('invalid_object');
  }

  /**
   * Adds a cross-field validation rule that runs after all fields pass.
   */
  check(check: ObjectCheck<InferObject<TShape>>): ObjectSchema<TShape> {
    const schema = this.clone();
    schema.checks.push(check);
    return schema;
  }

  /**
   * Creates a new object schema with additional or replaced fields.
   */
  extend<TExtension extends ObjectShape>(
    extension: TExtension,
  ): ObjectSchema<TShape & TExtension> {
    return new ObjectSchema({
      ...this.shape,
      ...extension,
    });
  }

  protected parseDefined(input: unknown, path: ValidationPath) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return this.fail(path, 'invalid_type', 'invalid_object');
    }

    const source = new Map(Object.entries(input));
    const valueEntries: [string, unknown][] = [];
    const issues: ValidationIssue[] = [];

    for (const [key, schema] of Object.entries(this.shape)) {
      if (!isSchema(schema)) {
        issues.push({
          path: [...path, key],
          code: 'invalid_schema',
          message: 'invalid_schema',
        });
        continue;
      }

      const result = schema.parseInternal(source.get(key), [...path, key]);
      if (!result.success) {
        issues.push(...result.issues);
        continue;
      }

      valueEntries.push([key, result.data]);
    }

    if (issues.length > 0) {
      return {
        success: false as const,
        issues,
      };
    }

    const checkIssues: ValidationIssue[] = [];
    const context: CheckContext = {
      addIssue: issue => {
        checkIssues.push({
          path: [...path, ...(issue.path ?? [])],
          code: issue.code ?? 'custom',
          message: issue.message,
        });
      },
    };

    const data: InferObject<TShape> = Object.create(
      Object.getPrototypeOf(input),
    );
    Object.assign(data, Object.fromEntries(valueEntries));

    for (const check of this.checks) {
      check(data, context);
    }

    if (checkIssues.length > 0) {
      return {
        success: false as const,
        issues: checkIssues,
      };
    }

    return {
      success: true as const,
      data,
    };
  }

  protected clone(): ObjectSchema<TShape> {
    const schema = new ObjectSchema(this.shape);
    schema.checks.push(...this.checks);
    return this.copyBaseStateTo(schema);
  }
}
