import type { InjectionToken } from '@imcauan/dependency-injection';

/**
 * Error thrown when query integration configuration is missing or invalid.
 *
 * These errors are intentionally descriptive because most failures happen at
 * the boundary between use-case metadata and React hook usage, where vague
 * TanStack or JavaScript runtime errors are hard to diagnose.
 */
export class QueryIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueryIntegrationError';
  }
}

/** Returns the token description used in query integration error messages. */
export function getTokenName(token: InjectionToken<unknown>): string {
  return token.description ?? 'unknown token';
}
