# @imcauan/vitest-config

Shared Vitest config: sensible defaults, path aliases, coverage exclusions and
presets that label test files by type.

## Install

```bash
pnpm add -D @imcauan/vitest-config vitest
```

`vitest` (`^5.0.0`) is a required peer. See the
[root README](../../README.md#install) to set up the GitHub Packages registry.

## Usage

```ts
// vitest.config.ts
import {
  commonCoverageExcludes,
  defineSharedVitestConfig,
  unitIntegrationTestTypes,
} from '@imcauan/vitest-config';

export default defineSharedVitestConfig({
  rootDir: import.meta.dirname,
  aliases: { '@': 'src' },
  testType: unitIntegrationTestTypes,
  test: {
    environment: 'node',
    include: ['tests/**/*.{spec,test}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [...commonCoverageExcludes, '**/*.generated.ts'],
    },
  },
});
```

`defineSharedVitestConfig` wraps Vitest's `defineConfig`:

- **Defaults:** `globals: true`, `fileParallelism: false`,
  `testTimeout: 10000`. Anything in `test` overrides them.
- **`aliases`:** a map of alias → path relative to `rootDir`, resolved to
  absolute paths for `resolve.alias`.
- **`testType`:** when set, the reporter is a
  [`TestTypeReporter`](../test-setup#vitest) that labels each file, replacing
  `test.reporters`.
- Any other Vite option is passed through.

### Presets

| Preset                     | Labels                                                                   |
| -------------------------- | ------------------------------------------------------------------------ |
| `unitIntegrationTestTypes` | `*.spec.*` → `unit`, `*.test.*` → `integration`, anything else → `unit`  |
| `apiIntegrationTestTypes`  | `*.e2e-spec.*` / `*.e2e.spec.*` → `e2e`, everything else → `integration` |
| `integrationTestType`      | Every file → `integration`                                               |
| `browserTestType`          | Every file → `browser`                                                   |

### Coverage exclusions

`commonCoverageExcludes` excludes test files, `.d.ts` files, `mocks/`,
`__mocks__/`, `__tests__/` and `node_modules`. It doesn't know your naming
conventions; add them yourself, as in the example above.

## API

- `defineSharedVitestConfig(options)`: builds a Vitest config.
- `SharedVitestConfigOptions`: its options (`rootDir`, `aliases`, `test`,
  `testType`, plus Vite options).
- `resolveWorkspaceAliases(rootDir, aliases?)`: resolves an alias map to
  absolute paths.
- `WorkspaceAliasMap`: `Record<string, string>`.
- `commonCoverageExcludes`: generic coverage exclusion globs.
- `unitIntegrationTestTypes`, `apiIntegrationTestTypes`,
  `integrationTestType`, `browserTestType`: test-type presets.

## Design notes

Vitest is this package's purpose, so its core imports `vitest` and `vitest`
is a required peer. It's a named exception to the
[constitution](../../CONSTITUTION.md#exceptions).

## License

MIT
