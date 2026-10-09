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

| Package                                                          | What it does                                                      | Integrations                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------- |
| [`@imcauan/validation`](packages/validation)                     | Schema validation with type inference and Standard Schema support |                                    |
| [`@imcauan/environment`](packages/environment)                   | Typed, validated environment variables                            | `/nestjs`                          |
| [`@imcauan/dependency-injection`](packages/dependency-injection) | Token-based dependency injection without reflection               | `/react`, `/testing`               |
| [`@imcauan/logger`](packages/logger)                             | Structured logging with OpenTelemetry trace correlation           | `/nestjs`                          |
| [`@imcauan/feature-flags`](packages/feature-flags)               | A feature-flag port, and a NestJS guard that gates routes on it   | `/nestjs`                          |
| [`@imcauan/routines`](packages/routines)                         | Scheduled routines with an overlap guard and error isolation      | `/nestjs`                          |
| [`@imcauan/tracing`](packages/tracing)                           | Starts OpenTelemetry tracing in Node                              | `/register`                        |
| [`@imcauan/translation`](packages/translation)                   | Typed translators for Paraglide catalogs and nestjs-i18n          | `/nestjs`                          |
| [`@imcauan/jwt`](packages/jwt)                                   | Token signer and verifier ports with typed verification errors    | `/nestjs`                          |
| [`@imcauan/push-notifications`](packages/push-notifications)     | Web Push: subscribe in the browser, send from the server          | `/browser`, `/web-push`, `/nestjs` |
| [`@imcauan/http-client`](packages/http-client)                   | HTTP client ports with normalized responses, retries and hooks    | `/axios`                           |
| [`@imcauan/form`](packages/form)                                 | Validates react-hook-form forms with `@imcauan/validation`        | `/react`                           |
| [`@imcauan/test-setup`](packages/test-setup)                     | Test helpers: container lifecycle, test-type reporter             | `/vitest`                          |
| [`@imcauan/vitest-config`](packages/vitest-config)               | Shared Vitest config and presets                                  |                                    |
| [`@imcauan/typescript-config`](packages/typescript-config)       | Shared `tsconfig` bases                                           |                                    |

All packages are on `0.x`: a `minor` release may contain breaking changes
([bump rules](docs/CHANGESET.md#bump-rules-while-on-0x)).

## Install

The packages are published to
[GitHub Packages](docs/adr/0002-publish-to-github-packages.md), which requires
a token even for public packages.

1. Create a [classic personal access token](https://github.com/settings/tokens)
   with the `read:packages` scope.
2. Point the `@imcauan` scope at GitHub Packages in your project's `.npmrc`
   (safe to commit):

   ```ini
   @imcauan:registry=https://npm.pkg.github.com
   ```

3. Put the token in your **user** `~/.npmrc`, not the project's. pnpm 11
   ignores auth tokens in a project `.npmrc`.

   ```bash
   echo '//npm.pkg.github.com/:_authToken=<your token>' >> ~/.npmrc
   pnpm add @imcauan/validation
   ```

In CI, pass the token as a secret and write it to the user config, for
example with `actions/setup-node` (`registry-url: https://npm.pkg.github.com`,
`scope: '@imcauan'`, and `NODE_AUTH_TOKEN` set to the secret). Each package's
README lists its peer dependencies.

**Optional peers get installed by default.** GitHub Packages drops the
metadata that marks peers as optional, so npm and pnpm install every peer,
NestJS and React included, even if you only use a package's core
([ADR 0007](docs/adr/0007-github-packages-optional-peers.md)). Cores never
import them, so nothing extra runs. To skip those installs, set
`auto-install-peers=false` in your project's `.npmrc` (pnpm) or install with
`--legacy-peer-deps` (npm), and add the required peers yourself.

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

- **Docs site** (live): [imcauan.github.io/packages](https://imcauan.github.io/packages),
  rendered from this repo's Markdown ([ADR 0008](docs/adr/0008-docs-site.md)).
- **`create` CLI** (planned): scaffolds new projects wired up with these
  packages.

## License

[MIT](LICENSE) © Cauan Diniz
