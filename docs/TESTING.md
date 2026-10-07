# Testing

Tests run with [Vitest](https://vitest.dev). Each package owns its tests and
its `vitest.config.ts`; the root `pnpm test` runs them all.

## Layout and naming

```
packages/<name>/
├── src/
│   ├── index.ts
│   └── nestjs/logger.module.ts
└── tests/
    ├── mocks/                       # typed stubs, one file per dependency
    ├── trace-mixin.spec.ts          # unit
    └── nestjs/
        └── logger.module.spec.ts    # unit, mirrors src/nestjs/
```

| Suffix         | Kind        | What it may touch                                                         |
| -------------- | ----------- | ------------------------------------------------------------------------- |
| `*.spec.ts(x)` | Unit        | Code in memory. Collaborators are fakes or mocks.                         |
| `*.test.ts(x)` | Integration | Real I/O: the filesystem, a git repository, a child process, a container. |

The reporter labels each file `unit` or `integration` from its suffix.

## What to test

- **The public API, through the public entry.** Import from `../src` or
  `../src/nestjs`, the same entries consumers use, not from internal files.
  Internals are covered through the API.
- **Every public export** has at least one test.
- **Integrations** get a test that wires them into their framework for real
  (for example, compiling a NestJS testing module), not only unit tests of
  their parts.
- **Types are API too.** When inference is the feature
  (`Infer<typeof schema>`), assert it with `expectTypeOf`.
- **No names from real apps** in fixtures. Use neutral ones (`my-service`,
  `APP_NAME`).

## Writing tests

### General rules

- **Vitest globals, no value imports.** `describe`, `it`, `expect`, `vi` and the
  hooks are globals: every `tsconfig.json` lists `vitest/globals` and
  `vitest/importMeta` in `types`, and every Vitest config sets `globals: true`.
  Import only types from `vitest` (`import type { Mocked } from 'vitest'`).
- **Test first.** New behavior starts with a failing test.
- **One behavior per `it`.** Never assert two unrelated outcomes in one test.
- **Names describe the observable outcome**, prefixed with `should`:
  `it('should return the merged environment')`. Interactions use
  `should call <dependency> with correct values`.
- **`describe` groups by method or scenario**, not by file structure.
- **Arrange, act, assert**, separated by a blank line.
- **Never call the SUT inside `expect()`.** Assign the result (or the promise)
  first:

  ```ts
  const result = await sut.execute(params);
  expect(result).toEqual({ sent: true });

  const promise = sut.execute(params);
  await expect(promise).rejects.toThrow(MailerError);
  ```

### Unit specs: `makeSut()`

Every unit spec builds its system under test (SUT) through a `makeSut()`
factory, called inside each `it`. Nothing mutable (stubs, spies, state) is
shared at `describe` scope.

```ts
// tests/welcome-service.spec.ts
import type { Mocked } from 'vitest';

import { MailerError, WelcomeService, type Mailer } from '../src';
import { makeMailerStub } from './mocks/mailer.stub';

type SutTypes = {
  sut: WelcomeService;
  mailerStub: Mocked<Mailer>;
};

const makeSut = (): SutTypes => {
  const mailerStub = makeMailerStub();
  const sut = new WelcomeService(mailerStub);

  return { sut, mailerStub };
};

describe('WelcomeService', () => {
  describe('welcome', () => {
    it('should call mailer.send with correct values', async () => {
      const { sut, mailerStub } = makeSut();

      await sut.welcome({ email: 'any@email.com' });

      expect(mailerStub.send).toHaveBeenCalledWith({
        to: 'any@email.com',
        subject: 'Welcome',
      });
    });

    it('should throw when the mailer fails', async () => {
      const { sut, mailerStub } = makeSut();
      mailerStub.send.mockRejectedValueOnce(new MailerError('any-message'));

      const promise = sut.welcome({ email: 'any@email.com' });

      await expect(promise).rejects.toThrow(MailerError);
      await expect(promise).rejects.toMatchObject({ message: 'any-message' });
    });
  });
});
```

- **`SutTypes`.** A `makeSut()` that returns a fixture object declares a named
  `SutTypes` type and uses it as its explicit return type; an async factory
  returns `Promise<SutTypes>`. A factory that returns only the SUT may use the
  SUT's own type instead.
- **Typed stubs, not inline mocks.** Each injected dependency has a
  `make<Dependency>Stub()` factory in `tests/mocks/` that returns Vitest's
  `Mocked<Dependency>`. Specs never assemble dependencies from inline
  `vi.fn()` objects.

  ```ts
  // tests/mocks/mailer.stub.ts
  import type { Mocked } from 'vitest';

  import type { Mailer } from '../../src';

  export const makeMailerStub = (): Mocked<Mailer> => ({
    send: vi.fn().mockResolvedValue(undefined),
  });
  ```

- **Happy path by default, `Once` for overrides.** Stubs and `makeSut()`
  configure the happy path with `mockResolvedValue` / `mockReturnValue`. A
  test that needs different behavior overrides it with the `Once` variant
  (`mockResolvedValueOnce`, `mockRejectedValueOnce`).
- **Literal values in call assertions.** Assertions on the arguments a
  dependency received use raw literals, not variables, unless the value is
  truly dynamic (a generated id, a timestamp).
- **Error class and properties together.** Capture the promise once and chain
  two `rejects` matchers on it, as in the example above.
- **`any-` fixtures.** Values whose content doesn't matter are explicit
  literals prefixed with `any`: `'any-message'`, `'any-name'`,
  `'any@email.com'`. The prefix tells the reader the test doesn't depend on
  it. Use a meaningful literal (`'invalid-email'`, `65536`) only when the
  behavior under test depends on that exact value.

### Integration tests

- Real resources (a temporary directory, a git repository, a container) are
  created fresh in `beforeEach` and torn down in `afterEach`, so no state
  leaks between tests. The SUT is rebuilt in `beforeEach`; there's no
  `makeSut()` wrapper.
- Assert observable behavior (returned values, files on disk, repository
  state, thrown errors), not implementation details.
- Each `it` covers exactly one outcome.

## How `test-setup` and `vitest-config` are used here

The two packages are published for consumers, and this repo is their first
consumer.

- **`@imcauan/test-setup`** has framework-free helpers in its core (for
  example, `TestContainer`, a lifecycle base class for services started around
  integration tests) and Vitest-specific pieces in `@imcauan/test-setup/vitest`
  (the `TestTypeReporter` behind the `unit` / `integration` labels).
- **`@imcauan/vitest-config`** builds on it: `defineSharedVitestConfig` applies
  shared defaults (globals, timeouts, the reporter, aliases), and presets such
  as `unitIntegrationTestTypes` map file suffixes to labels.

A package's `vitest.config.ts`:

```ts
import {
  defineSharedVitestConfig,
  unitIntegrationTestTypes,
} from '@imcauan/vitest-config';

export default defineSharedVitestConfig({
  rootDir: import.meta.dirname,
  testType: unitIntegrationTestTypes,
  test: {
    environment: 'node',
    include: ['tests/**/*.{spec,test}.ts'],
  },
});
```

Each package lists `@imcauan/vitest-config` as a `workspace:*` dev dependency.
Its `exports` point to `dist` (constitution, rule 8), so it must be built
before any package's tests run. `pnpm build` builds packages in dependency
order, and the pre-push hook and CI build before testing.

### Bootstrapping

The two packages can't test themselves through themselves:

- `test-setup` has a plain `vitest.config.ts` (it's a dependency of
  `vitest-config`).
- `vitest-config` tests import its source directly and use a plain config,
  so a bug in it can't hide its own failing tests.

## Commands

```bash
pnpm build                                  # needed once before testing
pnpm test                                   # every package
pnpm --filter @imcauan/logger test          # one package
pnpm --filter @imcauan/logger exec vitest   # watch mode
```
