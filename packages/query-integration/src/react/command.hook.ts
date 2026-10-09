import type { InjectionToken } from '@imcauan/dependency-injection';
import { useDependency } from '@imcauan/dependency-injection/react';
import {
  useMutation as useTanStackMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  getCommandOptions,
  type CommandMetadata,
  type Executable,
  type ExecuteParams,
  type ExecuteResult,
} from '..';

import { QueryIntegrationError, getTokenName } from './errors';
import { execute } from './execute';
import { invalidateCommandQueries } from './invalidation';
import { mergeCommandOptions } from './merge-command-options';

/**
 * Local options accepted by `useCommand`.
 *
 * The `token` selects the command from the nearest
 * `DependencyProvider`. Remaining options are TanStack mutation options plus
 * query-integration command metadata. Local options override scalar decorator
 * metadata and participate in callback composition.
 */
export type UseCommandOptions<
  TExecutable extends Executable,
  TError = Error,
  TContext = unknown,
> = {
  /**
   * Dependency-injection token for the command.
   *
   * The hook resolves this token through the nearest `DependencyProvider` and
   * calls the resolved executable's `execute` method as the mutation function.
   */
  token: InjectionToken<TExecutable>;
} & CommandMetadata<
  ExecuteResult<TExecutable>,
  TError,
  ExecuteParams<TExecutable>,
  TContext
>;

/**
 * Resolves a command from DI and executes it through TanStack Query's
 * mutation API.
 *
 * The hook exposes command-oriented naming while delegating internally to
 * `useMutation`. Variables and result types are inferred from the executable's
 * structural `execute` method. After a successful command it performs
 * declarative invalidation, then runs metadata callbacks, then local callbacks.
 */
export function useCommand<
  TExecutable extends Executable,
  TError = Error,
  TContext = unknown,
>({
  token,
  ...localOptions
}: UseCommandOptions<TExecutable, TError, TContext>): UseMutationResult<
  ExecuteResult<TExecutable>,
  TError,
  ExecuteParams<TExecutable>,
  TContext
> {
  const executable = useDependency(token);
  const queryClient = useQueryClient();
  const metadata = getCommandOptions<
    ExecuteResult<TExecutable>,
    TError,
    ExecuteParams<TExecutable>,
    TContext
  >(executable);
  const effectiveOptions = mergeCommandOptions(metadata, localOptions);
  const { invalidates, onSuccess, ...mutationOptions } = effectiveOptions;

  assertExecutable(executable, token);

  return useTanStackMutation({
    ...mutationOptions,
    mutationFn: variables => execute(executable, variables),
    onSuccess: async (result, variables, context, mutationContext) => {
      await invalidateCommandQueries({
        queryClient,
        invalidates,
        variables,
        result,
      });
      await onSuccess?.(result, variables, context, mutationContext);
    },
  });
}

function assertExecutable<TExecutable extends Executable>(
  executable: TExecutable,
  token: InjectionToken<TExecutable>,
): void {
  if (typeof executable.execute !== 'function') {
    throw new QueryIntegrationError(
      `Resolved provider ${getTokenName(token)} does not expose an execute() method.`,
    );
  }
}
