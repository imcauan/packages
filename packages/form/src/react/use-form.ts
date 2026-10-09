import type { Schema } from '@imcauan/validation';
import {
  useForm as useReactHookForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';

import { validationResolver } from '..';

/** react-hook-form's options, plus the schema that validates the values. */
export interface UseFormOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: Schema<T>;
}

/**
 * react-hook-form's `useForm`, validated by `schema` through
 * `validationResolver`.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   schema: signInSchema,
 *   defaultValues: { email: '', password: '' },
 * });
 * ```
 */
export function useForm<T extends FieldValues>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  return useReactHookForm<T>({
    ...options,
    resolver: validationResolver(options.schema),
  });
}
