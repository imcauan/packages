# @imcauan/environment

Typed, validated environment variables, with a NestJS module built on
`@nestjs/config`. Schemas come from
[`@imcauan/validation`](../validation).

## Install

```bash
pnpm add @imcauan/environment @imcauan/validation

# for @imcauan/environment/nestjs
pnpm add @nestjs/common @nestjs/config
```

`@imcauan/validation` is a dependency; install it too, to build the schemas.
`@nestjs/common` and `@nestjs/config` (`^12.0.0`) are optional peers, needed
only for the `/nestjs` subpath. See the [root README](../../README.md#install)
to set up the GitHub Packages registry.

## Usage

### `createTypedEnv`

Builds a typed object from a schema per variable and the raw values, for
example in a Vite app:

```ts
import { createTypedEnv } from '@imcauan/environment';
import { v } from '@imcauan/validation';

export const env = createTypedEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: v.url({ error: 'invalid_api_url' }),
    VITE_API_TIMEOUT: v.number().coerce().default(10000),
  },
  runtimeEnv: import.meta.env,
});

env.VITE_API_URL; // string
env.VITE_API_TIMEOUT; // number
```

- Every key must start with `clientPrefix`, so a server-only variable can't
  slip into a client bundle. A key without it throws.
- Invalid or missing values throw a `ValidationError` that lists every issue.
- Only the declared keys are returned.

### The `IEnvironment` port

`IEnvironment<Schema>` is the interface application code depends on:
`get({ env: 'PORT' })` returns `Schema['PORT']`. Adapters implement it for
each framework, so code that reads configuration doesn't depend on one.

### `mergeEnvironmentSchemas`

Validates the same input against several schemas, for example one per
feature, and merges their output. Every schema runs, so one invalid variable
doesn't hide the others; all issues are reported in one `ValidationError`.

```ts
const validate = mergeEnvironmentSchemas<AppEnvironment>([
  v.object({ PORT: v.env.port(3000) }),
  v.object({
    DATABASE_URL: v.string({ requiredError: 'database_url_required' }),
  }),
]);

const environment = validate(process.env);
```

## Integrations

### NestJS

`EnvironmentGatewayModule.register()` sets up `ConfigModule.forRoot()` with a
validator built from your schemas, and binds an `IEnvironment` to the
`Environment` token:

```ts
import { Module } from '@nestjs/common';
import { EnvironmentGatewayModule } from '@imcauan/environment/nestjs';
import { v } from '@imcauan/validation';

type AppEnvironment = { PORT: number; DATABASE_URL: string };

@Module({
  imports: [
    EnvironmentGatewayModule.register<AppEnvironment>({
      isGlobal: true,
      schemas: [
        v.object({ PORT: v.env.port(3000) }),
        v.object({
          DATABASE_URL: v.string({ requiredError: 'database_url_required' }),
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

Inject it anywhere:

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { IEnvironment } from '@imcauan/environment';
import { Environment } from '@imcauan/environment/nestjs';

@Injectable()
export class DatabaseConfig {
  constructor(
    @Inject(Environment)
    private readonly environment: IEnvironment<AppEnvironment>,
  ) {}

  get url(): string {
    return this.environment.get({ env: 'DATABASE_URL' });
  }
}
```

- `register()` accepts every `ConfigModule.forRoot()` option except
  `validate`, which it builds from `schemas`.
- An invalid environment fails the app at bootstrap with every issue listed.
  `@nestjs/config` 12 validates asynchronously, so the error surfaces when
  Nest initializes the module, not when `register()` is called.
- `NestJsEnvironmentAdapter` is the `IEnvironment` implementation over
  `ConfigService`, exported for custom wiring.

## API

`@imcauan/environment`

- `createTypedEnv(options)`, `CreateTypedEnvOptions`, `TypedEnv`
- `IEnvironment<Schema>`
- `mergeEnvironmentSchemas(schemas)`

`@imcauan/environment/nestjs`

- `EnvironmentGatewayModule.register(options)`, `EnvironmentModuleOptions`
- `Environment`: the injection token.
- `NestJsEnvironmentAdapter`

## Design notes

Schemas, variable names and secrets belong to your app. This package only
validates them and adapts the result to each framework.

## License

MIT
