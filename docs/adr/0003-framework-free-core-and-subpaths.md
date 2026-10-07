# ADR 0003: Framework-free core, framework glue in subpaths

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The extracted packages serve apps built on different frameworks: a NestJS API
and a React web app today, maybe others later. In Worksy, some packages mixed
the two: framework code reachable from the root entry, framework peers marked
as required, and app conventions (path aliases, wiring) inside shared configs.

A consumer that uses only the framework-free part should neither install nor
load a framework it doesn't use.

## Decision

- Each package's **root entry is a framework-free core**: types, ports
  (interfaces and tokens) and logic that runs anywhere.
- **Framework glue lives in subpath exports** named after the framework
  (`@imcauan/logger/nestjs`, `@imcauan/dependency-injection/react`). Only these
  import the framework.
- **Framework packages are optional peer dependencies.** The consumer brings
  their own copy.
- **Ports and adapters:** interfaces live in the core; framework
  implementations are adapters in the subpath.
- **Packages don't know about app architecture.** Folder conventions, path
  aliases and DI layering belong to the consuming app (and later to the
  `create` CLI's templates).
- **Only entries are public.** No deep imports, no wildcard exports.

## Consequences

- Core-only consumers install nothing framework-related, and the core can be
  tested without a framework.
- Adding another framework is a new subpath with new optional peers, without
  changing the core.
- Optional peers aren't installed automatically. Each README lists what each
  subpath needs.
- Some Worksy imports change shape: for example, `@repo/environment/browser`
  becomes the root `@imcauan/environment`, and deep imports such as
  `@repo/vitest-config/coverage` become root imports.
- Two packages are named exceptions in the constitution:
  `typescript-config` (static JSON, no core code) and `vitest-config`
  (Vitest is its purpose).
