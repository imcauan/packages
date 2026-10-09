export namespace TokenSigner {
  export type Params = {
    /** The token's `sub` claim. */
    subject: string;
    /** The token's `iss` claim. */
    issuer: string;
    secret: string;
    /** Lifetime in seconds. */
    expiresIn: number;
    /** Extra claims. */
    payload: Record<string, string | number | boolean>;
  };
  export type Response = Promise<string>;
}

/** Injection token for an `ITokenSigner`. */
export const TokenSigner = Symbol('TokenSigner');

/** Signs a token and returns it. */
export interface ITokenSigner {
  sign(params: TokenSigner.Params): TokenSigner.Response;
}
