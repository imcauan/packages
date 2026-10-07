import type { InjectionToken } from '../core/index.js';
import { useDependencyContainer } from './use-dependency-container.js';

/** Resolves a typed dependency from the nearest `DependencyProvider`. */
export function useDependency<T>(token: InjectionToken<T>): T {
  return useDependencyContainer().resolve(token);
}
