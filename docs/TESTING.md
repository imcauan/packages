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
    ├── trace-mixin.spec.ts          # unit
    └── nestjs/
        └── logger.module.spec.ts    # unit, mirrors src/nestjs/
```

| Suffix | Kind | What it may touch |
| --- | --- | --- |
| `*.spec.ts(x)` | Unit | Code in memory. Collaborators are fakes or mocks. |
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
- **Types are API too.** When inference is the feature (`Infer<typeof
  schema>`), assert it with `expectTypeOf`.
- **No names from real apps** in fixtures. Use neutral ones (`my-service`,
  `APP_NAME`).

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
