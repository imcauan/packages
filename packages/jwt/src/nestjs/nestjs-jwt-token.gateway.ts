import type { JwtService } from '@nestjs/jwt';

import {
  InvalidTokenError,
  TokenIssuerMismatchError,
  type ITokenSigner,
  type TokenSigner,
  type TokenVerifier,
} from '..';

/** `TokenVerifier.Params` plus the issuer and secret to check against. */
export type VerifyParams = TokenVerifier.Params & {
  issuer: string;
  secret: string;
};

/**
 * Signs and verifies tokens with `@nestjs/jwt`'s `JwtService`.
 *
 * `verify` takes the issuer and secret on each call, like `sign` does, so one
 * gateway serves several kinds of token. To get an `ITokenVerifier`, wrap it
 * per kind with that kind's issuer and secret (see the README).
 */
export class NestJsJwtTokenGateway implements ITokenSigner {
  constructor(private readonly jwtService: JwtService) {}

  async sign(params: TokenSigner.Params): TokenSigner.Response {
    return this.jwtService.signAsync(params.payload, {
      subject: params.subject,
      issuer: params.issuer,
      expiresIn: params.expiresIn,
      secret: params.secret,
    });
  }

  /**
   * Throws `InvalidTokenError` when the token doesn't verify, and
   * `TokenIssuerMismatchError` when it was issued by someone else.
   */
  async verify(params: VerifyParams): TokenVerifier.Response {
    let payload: TokenVerifier.Payload;

    try {
      payload = await this.jwtService.verifyAsync<TokenVerifier.Payload>(
        params.token,
        { secret: params.secret },
      );
    } catch (error) {
      throw new InvalidTokenError(error);
    }

    if (payload.iss !== params.issuer) {
      throw new TokenIssuerMismatchError();
    }

    return payload;
  }
}
