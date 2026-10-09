/**
 * Base of every verification error. Catch it to handle any failure, or a
 * subclass to handle one reason.
 */
export class TokenVerificationError extends Error {}

/** The token is malformed, expired, or its signature doesn't match. */
export class InvalidTokenError extends TokenVerificationError {
  constructor(cause: unknown) {
    super('Token is invalid or expired', { cause });
    this.name = 'InvalidTokenError';
  }
}

/** The token is valid, but was issued by someone else. */
export class TokenIssuerMismatchError extends TokenVerificationError {
  constructor() {
    super('Token issuer does not match the expected issuer');
    this.name = 'TokenIssuerMismatchError';
  }
}
