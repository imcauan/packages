# CLAUDE.md

Entry point for AI agents working in this repo. Details live in the linked
docs; don't duplicate them here.

## Read first

1. [CONSTITUTION.md](CONSTITUTION.md): non-negotiable rules. If a task
   conflicts with it, stop and ask. Don't change the code or the constitution
   to make them fit.
2. The doc for your task:
   - Changing or adding a package: [docs/PACKAGE_GUIDELINES.md](docs/PACKAGE_GUIDELINES.md)
   - Tests: [docs/TESTING.md](docs/TESTING.md)
   - Changesets and bumps: [docs/CHANGESET.md](docs/CHANGESET.md)
   - Releases: [docs/RELEASING.md](docs/RELEASING.md)
   - Why something is the way it is: [docs/adr/](docs/adr/)

## Commands

```bash
pnpm install && pnpm build      # setup; tests read sibling packages from dist
pnpm format && pnpm lint && pnpm knip
pnpm typecheck && pnpm test
pnpm --filter @imcauan/<name> test
pnpm changeset                  # when a published package changed
```

## Where things live

- `packages/<name>/`: published packages. `src/index.ts` is the
  framework-free core; `src/<framework>/` holds integration subpaths.
- `tools/`: private repo tooling, never published.
- `docs/`: guides and ADRs.
- `.changeset/`: pending changesets and config.
- `.github/workflows/`: CI, release, snapshot release.

## Agent rules

- Commits use Conventional Commits, one logical change each. Never pass
  `--no-verify`.
- Don't publish anything; releases run in CI.
- Don't add packages, features or dependencies that the task didn't ask for.
  Raise them as questions.
