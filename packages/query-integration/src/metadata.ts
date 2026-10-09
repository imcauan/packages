// Types only: the app loads the `reflect-metadata` polyfill once, at startup.
import type {} from 'reflect-metadata';

import type { CommandMetadata, QueryMetadata } from './types';

const QUERY_OPTIONS = Symbol('@imcauan/query-integration/query-options');
const COMMAND_OPTIONS = Symbol('@imcauan/query-integration/command-options');

/**
 * Reads `key` for a class or an instance. `Reflect.getMetadata` walks up to
 * base classes, so subclasses inherit their parent's options.
 */
function lookup(key: symbol, target: object): unknown {
  return Reflect.getMetadata(
    key,
    typeof target === 'function' ? target : target.constructor,
  );
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
    Reflect.defineMetadata(QUERY_OPTIONS, options, target);
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
    Reflect.defineMetadata(COMMAND_OPTIONS, options, target);
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
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- stored by QueryOptions; the type parameters are the caller's to match
  return lookup(QUERY_OPTIONS, target) as
    | QueryMetadata<TQueryData, TError, TSelectedData, TParams>
    | undefined;
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
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- stored by CommandOptions; the type parameters are the caller's to match
  return lookup(COMMAND_OPTIONS, target) as
    | CommandMetadata<TResult, TError, TVariables, TContext>
    | undefined;
}
