# ADR 0007: Optional peers on GitHub Packages

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

[ADR 0003](0003-framework-free-core-and-subpaths.md) makes framework packages
optional peer dependencies, so a consumer that uses only a package's core
installs nothing framework-related. Each `package.json` marks those peers in
`peerDependenciesMeta`.

[ADR 0002](0002-publish-to-github-packages.md) publishes to GitHub Packages.
Its npm registry drops `peerDependenciesMeta` from the metadata it serves,
both the full and the abbreviated documents, while the published tarballs keep
it. npm and pnpm decide which peers to install from that registry metadata, so
every optional peer looks required.

Checked on 2026-10-08 by installing only `@imcauan/logger@0.1.0` into an
empty project with pnpm 10:

- With the default `auto-install-peers=true`, pnpm also installed
  `@nestjs/common`, `@nestjs/core`, `nestjs-pino`, `pino`, `pino-http`,
  `pino-loki`, `pino-pretty` and `rxjs`.
- With `auto-install-peers=false`, it installed none of them and warned that
  they were missing.

npm 7+ installs peers by default too.

## Decision

Stay on GitHub Packages, and document the behavior:

- Package READMEs keep listing optional peers as optional, because that is
  what the packages declare and what other registries honor.
- The root README tells core-only consumers how to skip the extra installs:
  `auto-install-peers=false` (pnpm) or `--legacy-peer-deps` (npm). With that
  setting, they install required peers, such as `@opentelemetry/api` for the
  logger, themselves.
- Moving to npmjs.com stays the fix if it becomes a problem. It would
  supersede ADR 0002.

## Consequences

- With default settings, ADR 0003's "install only what you use" doesn't hold
  for consumers of GitHub Packages: core-only consumers get the frameworks
  installed anyway. The code is unaffected. Cores still never import a
  framework, so nothing extra is loaded at runtime.
- Consumers that use the integrations, like Worksy, install those peers
  anyway and see no difference.
- With `auto-install-peers=false`, pnpm prints "missing peer" warnings for the
  optional peers a consumer doesn't use. They're harmless, but they're noise.
- Lockfiles can record peer metadata from either source: the registry
  document (without `peerDependenciesMeta`) or a tarball's `package.json`
  (with it). Re-resolving the same versions can then rewrite those entries.
  Worksy's `packages:unlink` restores the saved lockfile instead of
  re-resolving for this reason.
