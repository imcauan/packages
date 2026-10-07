# @imcauan/dependency-injection

Token-based dependency injection with modules, lazy providers and a testing
API, without reflection.

## Install

```bash
pnpm add @imcauan/dependency-injection

# for @imcauan/dependency-injection/react
pnpm add react
```

`react` (`^18.2.0 || ^19.0.0`) is an optional peer, needed only for the
`/react` subpath. See the [root README](../../README.md#install) to set up the
GitHub Packages registry.

Modules use the `@Module()` class decorator. It works with TypeScript's
standard decorators and with `experimentalDecorators`.

## Usage

1. Give every dependency a typed token.
2. Describe how to build it with a provider.
3. Group providers in modules, and export the tokens other modules may use.
4. Create one container from your root module and resolve tokens from it.

```ts
import {
  DependencyContainer,
  Module,
  createInjectionToken,
  type FactoryProvider,
} from '@imcauan/dependency-injection';

interface Clock {
  now(): Date;
}

interface Mailer {
  send(message: { to: string; subject: string }): Promise<void>;
}

export const Clock = createInjectionToken<Clock>('Clock');
export const Mailer = createInjectionToken<Mailer>('Mailer');
export const WelcomeService =
  createInjectionToken<WelcomeService>('WelcomeService');

const makeWelcomeServiceProvider = (): FactoryProvider<
  WelcomeService,
  [Mailer, Clock]
> => ({
  provide: WelcomeService,
  inject: [Mailer, Clock],
  useFactory: (mailer, clock) => new WelcomeService(mailer, clock),
});

@Module({
  providers: [
    { provide: Clock, useValue: { now: () => new Date() } },
    { provide: Mailer, inject: [], useFactory: () => new SmtpMailer() },
  ],
  exports: [Clock, Mailer],
})
class InfrastructureModule {}

@Module({
  imports: [InfrastructureModule],
  providers: [makeWelcomeServiceProvider()],
  exports: [WelcomeService],
})
class AppModule {}

const container = DependencyContainer.create(AppModule);
const welcome = container.resolve(WelcomeService); // typed as WelcomeService
```

### Tokens

Interfaces don't exist at runtime, so each dependency gets a token:
`createInjectionToken<T>(description)`. The token carries the type `T`, and
every call creates a distinct token; the description only appears in error
messages.

### Providers

| Provider | Use for                                        | Shape                                                              |
| -------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Factory  | Building a dependency from other tokens        | `{ provide, inject: [...tokens], useFactory: (...deps) => value }` |
| Value    | Constants, configuration, prebuilt objects     | `{ provide, useValue }`                                            |
| Existing | An alias that returns another token's instance | `{ provide, useExisting: otherToken }`                             |

The `inject` tokens type the factory's arguments, in order. There are no class
providers and no async providers; construct classes in a factory.

### Modules and visibility

- A provider can inject tokens declared in its own module, or exported by a
  module it imports directly.
- A module can export tokens it declares, or tokens exported by a module it
  imports.
- The container can resolve only the tokens visible from the root module.

### The container

`DependencyContainer.create(rootModule)` validates the whole graph up front
and throws if it finds:

- an imported class without `@Module()` (`InvalidModuleError`);
- the same token provided twice (`DuplicateProviderError`);
- an export the module doesn't own or import (`InvalidModuleExportError`);
- a dependency or alias target the module can't see
  (`UnresolvedProviderDependencyError`);
- circular imports or dependencies (`CircularModuleError`,
  `CircularProviderError`).

Providers are lazy: a factory runs the first time its token is resolved, and
its result is cached for the container's lifetime. Resolving a token that
isn't visible throws `MissingProviderError`.

Create one container, in your app's composition root. There are no child or
scoped containers.

## Integrations

### React

React receives an existing container; it never creates one.

```tsx
import {
  DependencyProvider,
  useDependency,
} from '@imcauan/dependency-injection/react';

function App({ container }: { container: DependencyContainer }) {
  return (
    <DependencyProvider container={container}>
      <WelcomeButton />
    </DependencyProvider>
  );
}

function WelcomeButton() {
  const welcome = useDependency(WelcomeService);
  // ...
}
```

Using a hook outside `DependencyProvider` throws
`MissingDependencyProviderError`.

### Testing

`Test.createTestingModule()` builds a container for a test, with providers
replaced before anything is created:

```ts
import { Test } from '@imcauan/dependency-injection/testing';

const moduleRef = Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider({ provide: Mailer, useValue: mailerStub })
  .compile();

const welcome = moduleRef.get(WelcomeService); // built with mailerStub
```

- `providers` and `imports` work like a module's.
- `overrideProvider` / `overrideProviders` accept any provider shape. The last
  override for a token wins, and overriding a token no module provides throws.
- Overridden providers are never instantiated.
- Each compiled module has its own instances. After `close()`, `get()` throws
  `TestingModuleClosedError`.

## API

`@imcauan/dependency-injection`

- `createInjectionToken<T>(description)`, `InjectionToken<T>`
- `Module(metadata)`, `ModuleMetadata`, `ModuleType`, `DependencyModule`
- `defineModule({ name, ...metadata })`: deprecated; prefer `@Module()`.
- `DependencyContainer`: `create(module?, options?)`, `load`, `resolve`,
  `hasProvider`, `override`.
- `Provider`, `FactoryProvider`, `ValueProvider`, `ExistingProvider`
- Errors: `DependencyInjectionError` and its subclasses
  `MissingProviderError`, `DuplicateProviderError`, `CircularProviderError`,
  `CircularModuleError`, `InvalidModuleError`, `InvalidModuleExportError`,
  `UnresolvedProviderDependencyError`.

`@imcauan/dependency-injection/react`

- `DependencyProvider`, `DependencyContext`
- `useDependency(token)`, `useDependencyContainer()`
- `MissingDependencyProviderError`

`@imcauan/dependency-injection/testing`

- `Test.createTestingModule(metadata)`
- `TestingModuleBuilder`: `overrideProvider`, `overrideProviders`, `compile`
- `TestingModule`: `get`, `close`, `container`
- `TestingModuleClosedError`

## Design notes

- **No reflection.** No `reflect-metadata`, no constructor-parameter
  decorators, no `@Injectable()`. Dependencies are listed explicitly in
  `inject`, so they're visible and type-checked.
- **Validation before instantiation.** A broken graph fails when the container
  is created, not when some screen first resolves a token.
- **Explicit factories.** Factories are synchronous and named; there are no
  class or async providers.

## License

MIT
