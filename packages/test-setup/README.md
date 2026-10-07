# @imcauan/test-setup

Framework-free test helpers, plus a Vitest reporter that labels each test file
by type (`unit`, `integration`, `e2e`).

## Install

```bash
pnpm add -D @imcauan/test-setup

# for @imcauan/test-setup/vitest
pnpm add -D vitest
```

See the [root README](../../README.md#install) to set up the GitHub Packages
registry.

## Usage

`TestContainer` is a base class for anything your integration tests start and
stop: a database container, a local server, a temporary directory. Subclasses
implement `doStart()` and `doStop()`; the base class runs lifecycle hooks
around them and never starts or stops twice.

```ts
import { TestContainer } from '@imcauan/test-setup';

class TempDirContainer extends TestContainer {
  path = '';

  protected async doStart() {
    this.path = await mkdtemp(join(tmpdir(), 'any-prefix-'));
  }

  protected async doStop() {
    await rm(this.path, { recursive: true, force: true });
  }
}

const container = new TempDirContainer({
  hooks: { afterStart: () => console.log('ready') },
});

await container.init();
// ...
await container[Symbol.asyncDispose]();
```

It implements `Symbol.asyncDispose`, so `await using` stops it automatically:

```ts
{
  await using container = new TempDirContainer();
  await container.init();
} // stopped here
```

Hooks can also be added after construction with
`container.on(ContainerEvent.BEFORE_STOP, hook)`.

## Integrations

### Vitest

`TestTypeReporter` extends Vitest's default reporter and prefixes each test
file with a colored label. The first rule whose `pattern` matches the file
path wins; otherwise `defaultLabel` is used. With `NO_COLOR` set, labels print
as `[unit]`.

```ts
// vitest.config.ts
import { TestTypeReporter } from '@imcauan/test-setup/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      new TestTypeReporter({
        defaultLabel: { label: 'unit', color: 'cyan' },
        labels: [
          { pattern: /\.test\.ts$/, label: 'integration', color: 'green' },
        ],
      }),
    ],
  },
});
```

[`@imcauan/vitest-config`](../vitest-config) ships presets for common label
sets.

## API

`@imcauan/test-setup`

- `TestContainer`: abstract base class; `init()`, `[Symbol.asyncDispose]()`,
  `on(event, hook)`, `isRunning`.
- `TestContainerOptions`: `{ hooks?: ContainerHooks }`.
- `ContainerEvent`: `BEFORE_START`, `AFTER_START`, `BEFORE_STOP`, `AFTER_STOP`.
- `ContainerHook`, `ContainerHooks`: hook function and hook map types.

`@imcauan/test-setup/vitest`

- `TestTypeReporter`: Vitest reporter that labels files by type.
- `TestTypeReporterOptions`, `TestTypeRule`, `TestTypeLabel`,
  `TestTypeLabelColor`: its option types.

## License

MIT
