import { useContext } from 'react';
import type { DependencyContainer } from '../core/index.js';
import { DependencyContext } from './dependency.provider.js';
import { MissingDependencyProviderError } from './errors.js';

/**
 * Returns the container provided by `DependencyProvider`.
 *
 * Throws `MissingDependencyProviderError` when used outside the provider.
 */
export function useDependencyContainer(): DependencyContainer {
  const container = useContext(DependencyContext);
  if (!container) {
    throw new MissingDependencyProviderError();
  }
  return container;
}
