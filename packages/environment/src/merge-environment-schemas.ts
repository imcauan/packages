import {
  ValidationError,
  type Infer,
  type Schema,
  type ValidationIssue,
} from '@imcauan/validation';

type UnionToIntersection<U> = (
  U extends unknown ? (value: U) => void : never
) extends (value: infer I) => void
  ? I
  : never;

/** The environment `mergeEnvironmentSchemas(schemas)` produces: every schema's output, combined. */
export type MergedEnvironment<TSchemas extends readonly Schema<object>[]> =
  UnionToIntersection<Infer<TSchemas[number]>> & object;

/**
 * Validates `input` against every schema independently and merges their
 * outputs, so an invalid field in one schema doesn't hide failures from the
 * others. Throws a `ValidationError` with every issue found.
 *
 * The result type is inferred from the schemas, so it can't claim a field no
 * schema validates.
 */
export function mergeEnvironmentSchemas<
  TSchemas extends readonly Schema<object>[],
>(schemas: TSchemas): (input: unknown) => MergedEnvironment<TSchemas> {
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

    // Every schema succeeded, so `merged` holds each schema's output. The
    // compiler can't follow a loop that assigns several typed objects into
    // one, so the combined type is stated here, once.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
    return merged as MergedEnvironment<TSchemas>;
  };
}
