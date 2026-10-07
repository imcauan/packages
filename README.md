# @imcauan/packages

[![CI](https://github.com/imcauan/packages/actions/workflows/ci.yml/badge.svg)](https://github.com/imcauan/packages/actions/workflows/ci.yml)
[![Release](https://github.com/imcauan/packages/actions/workflows/release.yml/badge.svg)](https://github.com/imcauan/packages/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/github/license/imcauan/packages)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.19-339933)](docs/adr/0005-build-with-tsdown.md)

Small, typed TypeScript packages for building apps: validation, environment
config, dependency injection, logging and shared test setup. Every package has
a framework-free core, with NestJS and React integrations in separate
subpaths, so you install only what you use. They were extracted from a
production app and are published as ESM with type declarations under
`@imcauan/*`.

## Packages

| Package                                                          | What it does                                                      | Integrations         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------- |
| [`@imcauan/validation`](packages/validation)                     | Schema validation with type inference and Standard Schema support |                      |
| [`@imcauan/environment`](packages/environment)                   | Typed, validated environment variables                            | `/nestjs`            |
| [`@imcauan/dependency-injection`](packages/dependency-injection) | Token-based dependency injection without reflection               | `/react`, `/testing` |
| [`@imcauan/logger`](packages/logger)                             | Structured logging with OpenTelemetry trace correlation           | `/nestjs`            |
| [`@imcauan/test-setup`](packages/test-setup)                     | Test helpers: container lifecycle, test-type reporter             | `/vitest`            |
| [`@imcauan/vitest-config`](packages/vitest-config)               | Shared Vitest config and presets                                  |                      |
| [`@imcauan/typescript-config`](packages/typescript-config)       | Shared `tsconfig` bases                                           |                      |

All packages are on `0.x`: a `minor` release may contain breaking changes
([bump rules](docs/CHANGESET.md#bump-rules-while-on-0x)).

## Install

The packages are published to
[GitHub Packages](docs/adr/0002-publish-to-github-packages.md), which requires
a token even for public packages.

1. Create a [classic personal access token](https://github.com/settings/tokens)
   with the `read:packages` scope.
2. Add a `.npmrc` to your project:

   ```ini
   @imcauan:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

3. Export the token and install:

   ```bash
   export GITHUB_TOKEN=<your token>
   pnpm add @imcauan/validation
   ```

In CI, provide the token as a secret. Each package's README lists its peer
dependencies.

## Documentation

- [Constitution](CONSTITUTION.md): the rules every package follows
- [Contributing](CONTRIBUTING.md): setup, workflow, testing local changes
- [Package guidelines](docs/PACKAGE_GUIDELINES.md): layout, exports, README
  structure
- [Changesets](docs/CHANGESET.md): versioning and bump rules
- [Releasing](docs/RELEASING.md): publishing, snapshots, recovery
- [Testing](docs/TESTING.md): how tests are organized
- [Architecture decisions](docs/adr/)

## Roadmap

- **Docs site** (planned): a site that renders the package READMEs, guides and
  ADRs from this repo.
- **`create` CLI** (planned): scaffolds new projects wired up with these
  packages.

## License

[MIT](LICENSE) © Cauan Diniz
