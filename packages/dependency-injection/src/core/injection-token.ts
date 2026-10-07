declare const tokenType: unique symbol;

/**
 * Runtime token that carries the TypeScript type of the dependency it resolves.
 *
 * Interfaces are erased at runtime, so providers, module exports, aliases, and
 * consumers use this token as the dependency's stable identity.
 */
export type InjectionToken<T> = symbol & {
  readonly [tokenType]?: T;
};

/**
 * Creates a strongly typed dependency token.
 *
 * The description is used in runtime error messages and debugging output. It
 * does not participate in identity; every call creates a unique token.
 */
export function createInjectionToken<T>(
  description: string,
): InjectionToken<T> {
  return Symbol(description);
}
