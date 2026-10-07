# ADR 0001: One pnpm monorepo for all packages

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Reusable code is being extracted from the Worksy app into public packages.
The packages depend on each other (`environment` on `validation`,
`vitest-config` on `test-setup`), share tooling (TypeScript, Vitest, oxlint),
and are tested by the same configs they publish. Worksy already uses pnpm
workspaces with a version catalog.

## Decision

All packages live in one repository, `imcauan/packages`, managed with pnpm
workspaces:

- `packages/*`: published packages.
- `tools/*`: private tooling for this repo, never published.
- Shared dev tool versions come from the pnpm catalog in
  `pnpm-workspace.yaml`. Node, pnpm, TypeScript, Vitest and oxlint match
  Worksy's versions.
- Packages depend on each other through `workspace:^`, which pnpm rewrites to
  a real range (`^0.1.0`) when publishing.

## Consequences

- A change across packages (an API and its consumer) is one pull request, built
  and tested together.
- Tooling is configured once at the root.
- Each package is still versioned and published on its own
  ([ADR 0004](0004-changesets.md)).
- Contributors need pnpm; `packageManager` in `package.json` pins the version
  through Corepack.
- Catalog entries are only for dev tools. Peer dependencies are written as
  ranges, because `catalog:` publishes the exact version.
