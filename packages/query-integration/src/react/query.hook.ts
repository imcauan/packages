import type { InjectionToken } from '@imcauan/dependency-injection';
import { useDependency } from '@imcauan/dependency-injection/react';
import {
  useQuery as useTanStackQuery,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getQueryOptions,
  type Executable,
  type ExecuteParams,
  type ExecuteResult,
  type QueryParamsOption,
} from '..';
import { QueryIntegrationError, getTokenName } from './errors';
import { execute } from './execute';
import { mergeQueryOptions } from './merge-query-options';

/**
 * Local options accepted by `useQuery`.
 *
 * The `token` selects the query from the nearest `DependencyProvider`.
 * Executables with a parameter require `params`; those without may omit it.
 * Remaining options are TanStack Query options plus the package's optional
 * `onError` compatibility callback. Local options override scalar decorator
 * metadata.
 */
export type UseQueryOptions<
  TExecutable extends Executable,
  TError = Error,
  TSelectedData = ExecuteResult<TExecutable>,
> = {
  /**
   * Dependency-injection token for the query.
   *
   * The hook resolves this token through the nearest `DependencyProvider` and
   * calls the resolved executable's `execute` method as the query function.
   */
  token: InjectionToken<TExecutable>;
} & QueryParamsOption<TExecutable> &
  Omit<
    NonNullable<
      Parameters<
        typeof useTanStackQuery<
          ExecuteResult<TExecutable>,
          TError,
          TSelectedData,
          QueryKey
        >
      >[0]
    >,
    'queryFn' | 'queryKey'
  > & {
    /**
     * TanStack Query cache key for this executable.
     *
     * Local keys override decorator metadata. Use a resolver when params are
     * part of the cache identity.
     */
    queryKey?: QueryKey | ((params: ExecuteParams<TExecutable>) => QueryKey);

    /**
     * Optional error side-effect callback for query execution failures.
     *
     * This callback is invoked from the package-owned query function wrapper
     * and the error is rethrown so TanStack Query still owns error state.
     */
    onError?: (error: TError) => void;
  };

/**
 * Resolves a query from DI and executes it through TanStack Query.
 *
 * The hook exposes query-oriented naming while delegating internally to
 * TanStack Query's `useQuery`. Query data, params, and selected data are
 * inferred from the executable's structural `execute` method and optional
 * `select` function. Query keys may come from metadata or local options.
 */
export function useQuery<
  TExecutable extends Executable,
  TError = Error,
  TSelectedData = ExecuteResult<TExecutable>,
>(
  options: UseQueryOptions<TExecutable, TError, TSelectedData>,
): UseQueryResult<TSelectedData, TError> {
  const { token, params, ...localOptions } = options;
  const executable = useDependency(token);
  const metadata = getQueryOptions<
    ExecuteResult<TExecutable>,
    TError,
    TSelectedData,
    ExecuteParams<TExecutable>
  >(executable);
  const effectiveOptions = mergeQueryOptions<
    TExecutable,
    TError,
    TSelectedData
  >(metadata, localOptions);
  const { onError, ...queryOptions } = effectiveOptions;
  const queryKey = resolveQueryKey({
    queryKey: queryOptions.queryKey,
    params: params,
    token,
  });

  assertExecutable(executable, token);

  return useTanStackQuery({
    ...queryOptions,
    queryKey,
    queryFn: async (): Promise<ExecuteResult<TExecutable>> => {
      try {
        const result = await execute(executable, params);
        return result;
      } catch (error) {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TanStack Query types errors as TError the same way
        onError?.(error as TError);
        throw error;
      }
    },
  });
}

function resolveQueryKey<TExecutable extends Executable>({
  queryKey,
  params,
  token,
}: {
  queryKey:
    | QueryKey
    | ((params: ExecuteParams<TExecutable>) => QueryKey)
    | undefined;
  params: ExecuteParams<TExecutable> | undefined;
  token: InjectionToken<TExecutable>;
}): QueryKey {
  if (!queryKey) {
    throw new QueryIntegrationError(
      `No queryKey was configured for ${getTokenName(token)}. Add @QueryOptions({ queryKey }) or provide queryKey to useQuery().`,
    );
  }

  if (typeof queryKey !== 'function') {
    return queryKey;
  }

  if (params === undefined) {
    throw new QueryIntegrationError(
      `Dynamic queryKey for ${getTokenName(token)} requires query params.`,
    );
  }

  return queryKey(params);
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
