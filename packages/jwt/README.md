# @imcauan/jwt

Ports for signing and verifying tokens, with typed verification errors, and
a NestJS adapter built on [`@nestjs/jwt`](https://github.com/nestjs/jwt).

## Install

```bash
pnpm add @imcauan/jwt
```

The core has no dependencies. For the NestJS integration
(`@imcauan/jwt/nestjs`):

```bash
pnpm add @nestjs/jwt
```

| Peer             | Range     | Needed for                         |
| ---------------- | --------- | ---------------------------------- |
| `@nestjs/common` | `^12.0.0` | `/nestjs` (your NestJS app has it) |
| `@nestjs/jwt`    | `^12.0.0` | `/nestjs`                          |

Both are optional peers. See the [root README](../../README.md#install) to
set up the GitHub Packages registry.

## Usage

The core holds the ports your code depends on, so it never imports a JWT
library:

```ts
import {
  TokenVerificationError,
  type ITokenSigner,
  type ITokenVerifier,
} from '@imcauan/jwt';

export class SignIn {
  constructor(private readonly signer: ITokenSigner) {}

  execute(userId: string) {
    return this.signer.sign({
      subject: userId,
      issuer: 'my-service:access',
      secret: accessSecret,
      expiresIn: 900,
      payload: {},
    });
  }
}

export class Authenticate {
  constructor(private readonly verifier: ITokenVerifier) {}

  async execute(token: string) {
    try {
      return await this.verifier.verify({ token });
    } catch (error) {
      if (error instanceof TokenVerificationError) throw new Unauthorized();
      throw error;
    }
  }
}
```

A verifier throws a subclass of `TokenVerificationError`:
`InvalidTokenError` (malformed, expired or wrongly signed; the original error
is its `cause`) or `TokenIssuerMismatchError` (valid, but from another
issuer). `TokenSigner`, `AccessTokenVerifier` and `RefreshTokenVerifier` are
injection tokens for DI containers that bind interfaces to tokens.

## Integrations

### NestJS

`JwtGatewayModule.register(options?)` sets up `@nestjs/jwt` and exports it,
so `JwtService` can be injected. `NestJsJwtTokenGateway` wraps `JwtService`:
it's an `ITokenSigner`, and its `verify` takes the issuer and secret per
call, so one gateway serves several kinds of token. Wrap it per kind to get
an `ITokenVerifier`:

```ts
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenVerifier,
  TokenSigner,
  type ITokenVerifier,
} from '@imcauan/jwt';
import { JwtGatewayModule, NestJsJwtTokenGateway } from '@imcauan/jwt/nestjs';

@Module({
  imports: [JwtGatewayModule.register()],
  providers: [
    {
      provide: TokenSigner,
      inject: [JwtService],
      useFactory: (jwt: JwtService) => new NestJsJwtTokenGateway(jwt),
    },
    {
      provide: AccessTokenVerifier,
      inject: [JwtService],
      useFactory: (jwt: JwtService): ITokenVerifier => {
        const gateway = new NestJsJwtTokenGateway(jwt);
        return {
          verify: ({ token }) =>
            gateway.verify({
              token,
              issuer: 'my-service:access',
              secret: accessSecret,
            }),
        };
      },
    },
  ],
  exports: [TokenSigner, AccessTokenVerifier],
})
export class TokenModule {}
```

## API

`@imcauan/jwt`

- `ITokenSigner`: `sign({ subject, issuer, secret, expiresIn, payload })`
  returns the token. `expiresIn` is in seconds.
- `ITokenVerifier`: `verify({ token })` returns the claims
  (`TokenVerifier.Payload`).
- `TokenSigner`, `TokenVerifier`: namespaces with each port's `Params` and
  `Response` types; `TokenSigner` is also an injection token.
- `AccessTokenVerifier`, `RefreshTokenVerifier`: injection tokens.
- `TokenVerificationError`, `InvalidTokenError`, `TokenIssuerMismatchError`:
  verification errors.

`@imcauan/jwt/nestjs`

- `JwtGatewayModule.register(options?)`: `JwtModule.register(options)`,
  imported and exported.
- `NestJsJwtTokenGateway(jwtService)`: `sign(params)` and
  `verify({ token, issuer, secret })`.
- `VerifyParams`: `verify`'s parameters.

## Design notes

- The issuer is checked by the gateway, not by `@nestjs/jwt`, so an issuer
  mismatch gets its own error instead of a generic invalid-token one.
- The secret is passed per call rather than set on the module, so access and
  refresh tokens can use different secrets with one `JwtService`.

## License

MIT
