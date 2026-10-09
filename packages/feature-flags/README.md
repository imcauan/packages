# @imcauan/feature-flags

A feature-flag port with a no-op default, and a NestJS guard and decorator
that gate routes on it. It doesn't store flags: you implement the port over
your own flag store.

## Install

```bash
pnpm add @imcauan/feature-flags
```

The core has no dependencies. The NestJS integration
(`@imcauan/feature-flags/nestjs`) uses your app's NestJS:

| Peer                             | Range     | Needed for |
| -------------------------------- | --------- | ---------- |
| `@nestjs/common`, `@nestjs/core` | `^12.0.0` | `/nestjs`  |

Both are optional peers. See the [root README](../../README.md#install) to
set up the GitHub Packages registry.

## Usage

Implement `IFeatureFlagProvider` over wherever your flags live:

```ts
import type { IFeatureFlagProvider } from '@imcauan/feature-flags';

export class StoreFeatureFlagProvider implements IFeatureFlagProvider {
  constructor(private readonly store: FlagStore) {}

  async isEnabled(key: string): Promise<boolean> {
    return (await this.store.find(key))?.enabled ?? false;
  }
}
```

Until there's a store, `NoopFeatureFlagProvider` answers `false` for every
flag, so gated features stay off. `FeatureFlagProvider` is an injection token
for the port, for DI containers that bind interfaces to tokens.

## Integrations

### NestJS

Mark a route, or a whole controller, with `@RequireFeatureFlag`:

```ts
import { RequireFeatureFlag } from '@imcauan/feature-flags/nestjs';

@Controller('reports')
export class ReportsController {
  @RequireFeatureFlag('weekly-report')
  @Get('weekly')
  weekly() {
    // ...
  }
}
```

Then provide the flag provider and `FeatureFlagGuard` with factories, and
register the guard globally:

```ts
import { APP_GUARD, Reflector } from '@nestjs/core';
import {
  FeatureFlagProvider,
  type IFeatureFlagProvider,
} from '@imcauan/feature-flags';
import { FeatureFlagGuard } from '@imcauan/feature-flags/nestjs';

@Module({
  providers: [
    {
      provide: FeatureFlagProvider,
      inject: [FlagStore],
      useFactory: (store: FlagStore) => new StoreFeatureFlagProvider(store),
    },
    {
      provide: APP_GUARD,
      inject: [FeatureFlagProvider, Reflector],
      useFactory: (provider: IFeatureFlagProvider, reflector: Reflector) =>
        new FeatureFlagGuard(provider, reflector),
    },
  ],
})
export class FeatureFlagModule {}
```

The guard lets a request through when its route has no flag, so registering
it globally doesn't gate anything else. When the flag is off, it throws
`NotFoundException` (404): callers without the flag can't tell the route
exists. A method's flag wins over its controller's.

## API

`@imcauan/feature-flags`

- `IFeatureFlagProvider`: `isEnabled(key): Promise<boolean>`.
- `FeatureFlagProvider`: an injection token (a `Symbol`) for the port.
- `NoopFeatureFlagProvider`: every flag off.

`@imcauan/feature-flags/nestjs`

- `RequireFeatureFlag(key)`: a method and class decorator that gates a route
  behind `key`.
- `FeatureFlagGuard(provider, reflector)`: lets a request through when its
  route has no flag or the flag is on; throws `NotFoundException` otherwise.
- `REQUIRE_FEATURE_FLAG_KEY`: the metadata key the decorator writes.

## Design notes

- `FeatureFlagGuard` isn't `@Injectable()` and has no constructor metadata:
  provide it with a factory, as above. The package's build then doesn't
  depend on decorator metadata, and you choose which provider it gets.
- 404 instead of 403 keeps a disabled feature indistinguishable from a route
  that doesn't exist.

## License

MIT
