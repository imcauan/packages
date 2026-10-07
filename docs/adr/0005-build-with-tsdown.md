# ADR 0005: Build with tsdown, ESM only, no Turborepo

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Each package needs JavaScript and type declarations in `dist`. The candidates
were tsup and tsdown. Worksy builds all of these packages with tsdown 0.23.0
today, emitting both CommonJS and ESM, minified.

Worksy's API is compiled to CommonJS. Node 20.19+ (and 22.12+) can `require()`
an ES module that has no top-level `await`.

Worksy orchestrates builds with Turborepo; this repo starts with seven small
packages.

## Decision

- **tsdown** builds every package. It's built on Rolldown and Oxc (fast,
  same toolchain family as oxlint), emits `.d.mts` declarations itself, and is
  the successor the tsup project points to. Configs carry over from Worksy.
- **ESM only.** Each package emits `.mjs` and `.d.mts`. `exports` use a
  `default` condition (not `import`), so CommonJS consumers on Node 20.19+
  load the same build through `require()`. Published packages declare
  `engines.node: ">=20.19"`.
- **No minification.** Consumers minify their own bundles; readable output
  gives readable stack traces.
- **No Turborepo.** `pnpm -r build` already runs builds in dependency order,
  and a full build takes seconds.

## Consequences

- One build per package, and no dual-package hazard (two copies of a class
  under CommonJS and ESM).
- CommonJS consumers on Node older than 20.19 can't use the packages.
- Entries must not use top-level `await`.
- Without Turborepo there's no task caching: every `pnpm build` rebuilds
  everything. Revisit when a full build passes about a minute, or when CI
  would benefit from remote caching.
