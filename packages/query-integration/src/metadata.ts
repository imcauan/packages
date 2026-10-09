import type { CommandMetadata, QueryMetadata } from './types';

// Options are stored untyped: the class's type parameters don't exist at runtime.
const queryOptions = new WeakMap<object, object>();
const commandOptions = new WeakMap<object, object>();

/** Reads `store` for a class or an instance, walking up to base classes. */
function lookup<T>(store: WeakMap<object, T>, target: object): T | undefined {
  let current: unknown =
    typeof target === 'function' ? target : target.constructor;

  while (typeof current === 'function') {
    const options = store.get(current);
    if (options !== undefined) return options;
    current = Object.getPrototypeOf(current);
  }

  return undefined;
}

/**
 * Attaches TanStack Query options to a query class: its `queryKey` (or a
 * function of the query's params), `staleTime`, retries, and the rest.
 * `useQuery` reads them; options passed to `useQuery` win.
 *
 * It stores options only: it doesn't make the class injectable.
 *
 * @example
 * ```ts
 * @QueryOptions({ queryKey: (id: string) => ['products', id] })
 * export class LoadProduct {
 *   execute(id: string): Promise<Product> {
 *     // ...
 *   }
 * }
 * ```
 */
export function QueryOptions<
  TQueryData = unknown,
  TError = Error,
  TSelectedData = TQueryData,
  TParams = unknown,
>(
  options: QueryMetadata<TQueryData, TError, TSelectedData, TParams>,
): ClassDecorator {
  return target => {
    queryOptions.set(target, options);
  };
}

/**
 * Attaches TanStack Query mutation options to a command class: its
 * `mutationKey`, callbacks, and the queries it `invalidates`. `useCommand`
 * reads them; options passed to `useCommand` win, and callbacks from both
 * run, the class's first.
 *
 * @example
 * ```ts
 * @CommandOptions({ invalidates: [['products']] })
 * export class CreateProduct {
 *   execute(input: NewProduct): Promise<Product> {
 *     // ...
 *   }
 * }
 * ```
 */
export function CommandOptions<
  TResult = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: CommandMetadata<TResult, TError, TVariables, TContext>,
): ClassDecorator {
  return target => {
    commandOptions.set(target, options);
  };
}

/** The `@QueryOptions` of a class or instance, inherited from base classes. */
export function getQueryOptions<
  TQueryData = unknown,
  TError = Error,
  TSelectedData = TQueryData,
  TParams = unknown,
>(
  target: object,
): QueryMetadata<TQueryData, TError, TSelectedData, TParams> | undefined {
  // Stored by `QueryOptions`; the type parameters are the caller's to match.
  return lookup(queryOptions, target);
}

/** The `@CommandOptions` of a class or instance, inherited from base classes. */
export function getCommandOptions<
  TResult = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  target: object,
): CommandMetadata<TResult, TError, TVariables, TContext> | undefined {
  // Stored by `CommandOptions`; the type parameters are the caller's to match.
  return lookup(commandOptions, target);
}
