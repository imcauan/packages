import type { Schema, ValidationPath } from '@imcauan/validation';
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Resolver,
} from 'react-hook-form';

/** Sets `error` at `path`, creating the objects on the way, unless one is set. */
function setFieldError(tree: object, path: ValidationPath, error: FieldError) {
  let node = tree;

  for (const key of path.slice(0, -1)) {
    const child: unknown = Reflect.get(node, key);

    if (child === undefined) {
      const created = {};
      Object.assign(node, { [key]: created });
      node = created;
    } else if (typeof child !== 'object' || child === null || 'type' in child) {
      return;
    } else {
      node = child;
    }
  }

  const key = String(path.at(-1));
  if (Reflect.get(node, key) === undefined)
    Object.assign(node, { [key]: error });
}

/**
 * A react-hook-form `resolver` that validates the form's values with a
 * schema. Each issue becomes an error on the field at its path (nested for
 * nested fields), with the issue's code as `type` and its message as
 * `message`. A field keeps its first issue.
 */
export function validationResolver<T extends FieldValues>(
  schema: Schema<T>,
): Resolver<T> {
  return values => {
    const result = schema.safeValidate(values);

    if (result.success) return { values: result.data, errors: {} };

    const errors: FieldErrors<T> = {};

    for (const issue of result.issues) {
      if (issue.path.length === 0) continue;
      setFieldError(errors, issue.path, {
        type: issue.code,
        message: issue.message,
      });
    }

    return { values: {}, errors };
  };
}
