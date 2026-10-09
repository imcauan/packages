export namespace TokenVerifier {
  /** The verified token's claims. */
  export type Payload = Record<string, unknown> & {
    sub: string;
    exp: number;
    iat: number;
    iss?: string;
  };
  export type Params = {
    token: string;
  };
  export type Response = Promise<Payload>;
}

/**
 * Verifies a token and returns its claims. Throws a
 * `TokenVerificationError` when the token isn't valid.
 */
export interface ITokenVerifier {
  verify(params: TokenVerifier.Params): TokenVerifier.Response;
}

/** Injection token for the `ITokenVerifier` of access tokens. */
export const AccessTokenVerifier = Symbol('AccessTokenVerifier');

/** Injection token for the `ITokenVerifier` of refresh tokens. */
export const RefreshTokenVerifier = Symbol('RefreshTokenVerifier');
