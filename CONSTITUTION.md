# Constitution

These rules are non-negotiable. Code, docs, tooling and reviews follow them.
If a change can't follow a rule, stop and discuss it: change the rule in its own
pull request, with an [ADR](docs/adr/), before changing the code.

## Package design

1. **Every package has a framework-free core, exported from its root entry.**
   The core works in any runtime and outlives any framework.
2. **Framework glue lives in subpath exports** (`@imcauan/logger/nestjs`,
   `@imcauan/dependency-injection/react`), and its frameworks are **optional**
   peer dependencies. Consumers install only what they use.
3. **A package never knows about an app's architecture.** No folder conventions,
   path aliases, DI layers or app-specific wiring. That belongs to the
   consuming app.
4. **The root entry and each subpath entry are the only public API.** No deep
   imports and no wildcard exports. Internals can change without breaking
   anyone.
5. **Ports and adapters.** Interfaces live in the core; implementations are
   adapters. Swapping an implementation never touches its callers.
6. **Packages stay on `0.x` until their API is stable.** Going `1.0` is a
   deliberate decision, not a side effect of a bump.

## Dependencies and publishing

7. **Peer dependencies use ranges** (`^12.0.0`), never exact versions or
   `catalog:`. Exact peers force duplicate installs and needless conflicts.
8. **`exports` point to built files in `dist`, never to `src`.** Consumers run
   the code that was built, typed and tested.
9. **Every change to a published package needs a changeset.** Versions and
   changelogs come from changesets, not from memory.

## Workflow

10. **Commits follow [Conventional Commits](https://www.conventionalcommits.org).**
    History stays readable and reviewable.
11. **Checks are never skipped.** No `--no-verify`, no disabled or skipped tests
    to get a green build. A failing check is fixed or discussed, never
    bypassed.

## Exceptions

Each exception is named here; there are no implicit ones.

- **`@imcauan/typescript-config`** ships static JSON files from the package root
  instead of `dist` (rule 8). There is nothing to build.
- **`@imcauan/vitest-config`** imports `vitest` from its core (rule 1). Vitest is
  the package's purpose, so `vitest` is a required peer dependency.

## Child documents

- [CONTRIBUTING.md](CONTRIBUTING.md): setup, branch → PR → release flow,
  commits, testing local changes.
- [docs/PACKAGE_GUIDELINES.md](docs/PACKAGE_GUIDELINES.md): how a package is
  laid out and exported.
- [docs/CHANGESET.md](docs/CHANGESET.md): how changesets and bumps work.
- [docs/RELEASING.md](docs/RELEASING.md): versioning, publishing, snapshots,
  recovery.
- [docs/TESTING.md](docs/TESTING.md): how tests are organized and configured.
- [docs/adr/](docs/adr/): why things are the way they are.
