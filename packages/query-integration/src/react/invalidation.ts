import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { InvalidationResolver } from '..';
import { QueryIntegrationError } from './errors';

/**
 * Applies command invalidation metadata through the current TanStack Query
 * client.
 *
 * Static invalidation arrays are used as-is. Dynamic invalidation resolvers are
 * called with the command variables and resolved result so use cases can
 * invalidate keys that depend on the mutation outcome.
 */
export async function invalidateCommandQueries<TVariables, TResult>({
  queryClient,
  invalidates,
  variables,
  result,
}: {
  queryClient: QueryClient;
  invalidates: InvalidationResolver<TVariables, TResult> | undefined;
  variables: TVariables;
  result: TResult;
}): Promise<void> {
  if (!invalidates) {
    return;
  }

  const queryKeys =
    typeof invalidates === 'function'
      ? invalidates({ variables, result })
      : invalidates;

  for (const queryKey of queryKeys) {
    assertQueryKey(queryKey);
    await queryClient.invalidateQueries({ queryKey });
  }
}

function assertQueryKey(queryKey: QueryKey): void {
  if (!Array.isArray(queryKey)) {
    throw new QueryIntegrationError(
      'Command invalidation metadata returned an invalid query key.',
    );
  }
}
