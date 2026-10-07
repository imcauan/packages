import {
  ValidationError,
  type Schema as ValidationSchema,
  type ValidationIssue,
} from '@imcauan/validation';

/**
 * Validates `input` against every schema independently and merges their
 * outputs, so an invalid field in one schema doesn't hide failures from the
 * others. Throws a `ValidationError` with every issue found.
 */
export function mergeEnvironmentSchemas<Schema extends Record<string, unknown>>(
  schemas: ValidationSchema<Partial<Schema>>[],
): (input: unknown) => Schema {
  return input => {
    const merged: Record<string, unknown> = {};
    const issues: ValidationIssue[] = [];

    for (const schema of schemas) {
      const result = schema.safeParse(input);

      if (result.success) {
        Object.assign(merged, result.data);
      } else {
        issues.push(...result.issues);
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return merged as Schema;
  };
}
