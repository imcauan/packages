import { DependencyInjectionError } from '../core/index.js';

/** Thrown when a dependency hook is used outside `DependencyProvider`. */
export class MissingDependencyProviderError extends DependencyInjectionError {
  constructor() {
    super('DependencyProvider is missing');
    this.name = 'MissingDependencyProviderError';
  }
}
