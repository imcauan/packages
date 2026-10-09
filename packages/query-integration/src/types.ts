import type {
  MutationKey,
  MutationObserverOptions,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core';

/** Anything with an `execute` method: a use case, a service call. */
export type Executable = {
  execute: (...args: never[]) => unknown;
};

/** The arguments of `execute`. */
export type ExecuteArgs<T extends Executable> = Parameters<T['execute']>;

/** The single parameter of `execute`, or `void` when it takes none. */
export type ExecuteParams<T extends Executable> =
  ExecuteArgs<T> extends readonly [] ? void : ExecuteArgs<T>[0];

/** What `execute` resolves to. */
export type ExecuteResult<T extends Executable> = Awaited<
  ReturnType<T['execute']>
>;

/** `params` is required exactly when `execute` takes a parameter. */
export type QueryParamsOption<T extends Executable> =
  ExecuteArgs<T> extends readonly []
    ? { params?: undefined }
    : ExecuteParams<T> extends void
      ? { params?: undefined }
      : { params: ExecuteParams<T> };

/** A query key, or a function of the query's params that returns one. */
export type QueryKeyResolver<TParams> =
  | QueryKey
  | ((params: TParams) => QueryKey);

/** TanStack Query options for a query, stored by `@QueryOptions`. */
export type QueryMetadata<
  TQueryData = unknown,
  TError = Error,
  TSelectedData = TQueryData,
  TParams = unknown,
> = Omit<
  QueryObserverOptions<TQueryData, TError, TSelectedData>,
  'queryFn' | 'queryKey'
> & {
  queryKey?: QueryKeyResolver<TParams>;
  /** Called when `execute` throws, before the error reaches TanStack Query. */
  onError?: (error: TError) => void;
};

/** `QueryMetadata` typed from an `Executable`. */
export type ExecutableQueryMetadata<
  T extends Executable,
  TError = Error,
  TSelectedData = ExecuteResult<T>,
> = QueryMetadata<ExecuteResult<T>, TError, TSelectedData, ExecuteParams<T>>;

/** Query keys to invalidate after a command, or a function that returns them. */
export type InvalidationResolver<TVariables, TResult> =
  | readonly QueryKey[]
  | ((context: {
      variables: TVariables;
      result: TResult;
    }) => readonly QueryKey[]);

/** TanStack Query mutation options for a command, stored by `@CommandOptions`. */
export type CommandMetadata<
  TResult = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> = Omit<
  MutationObserverOptions<TResult, TError, TVariables, TContext>,
  'mutationFn' | 'mutationKey' | '_defaulted'
> & {
  mutationKey?: MutationKey;
  /** Queries to invalidate once the command succeeds. */
  invalidates?: InvalidationResolver<TVariables, TResult>;
};

/** `CommandMetadata` typed from an `Executable`. */
export type ExecutableCommandMetadata<
  T extends Executable,
  TError = Error,
  TContext = unknown,
> = CommandMetadata<ExecuteResult<T>, TError, ExecuteParams<T>, TContext>;
