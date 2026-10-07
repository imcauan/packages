import type { InjectionToken } from './injection-token.js';

/**
 * Provider that lazily creates a dependency from other injected tokens.
 *
 * The `Dependencies` tuple controls the `inject` token list and the factory
 * argument types in the same order.
 */
export type FactoryProvider<
  T = unknown,
  Dependencies extends readonly unknown[] = readonly unknown[],
> = {
  provide: InjectionToken<T>;
  inject: {
    [Index in keyof Dependencies]: InjectionToken<Dependencies[Index]>;
  };
  useFactory(...dependencies: Dependencies): T;
};

/**
 * Provider that resolves a token to a prebuilt value.
 *
 * Useful for constants, configuration values, and test doubles.
 */
export type ValueProvider<T = unknown> = {
  provide: InjectionToken<T>;
  useValue: T;
};

/**
 * Provider that aliases one token to another token of the same type.
 *
 * Resolving the alias returns the target token's cached instance.
 */
export type ExistingProvider<T = unknown> = {
  provide: InjectionToken<T>;
  useExisting: InjectionToken<T>;
};

/**
 * Union of all provider shapes supported by the production container and the
 * testing override API.
 */
export type Provider<
  T = unknown,
  Dependencies extends readonly unknown[] = readonly unknown[],
> = FactoryProvider<T, Dependencies> | ValueProvider<T> | ExistingProvider<T>;

/** @internal */
export function isFactoryProvider(
  provider: Provider,
): provider is FactoryProvider {
  return 'useFactory' in provider;
}

/** @internal */
export function isValueProvider(provider: Provider): provider is ValueProvider {
  return 'useValue' in provider;
}

/** @internal */
export function isExistingProvider(
  provider: Provider,
): provider is ExistingProvider {
  return 'useExisting' in provider;
}
