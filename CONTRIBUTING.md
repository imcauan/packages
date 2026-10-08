# Contributing

Read the [constitution](CONSTITUTION.md) first. It's short, and every review
checks against it.

## Setup

Requirements: Node `24.18.0` (see `.nvmrc`) and pnpm `10.33.4` (pinned in
`package.json`, provided by Corepack).

```bash
nvm use                # or any Node version manager that reads .nvmrc
corepack enable        # makes the pinned pnpm available
pnpm install           # also installs the git hooks
pnpm build             # tests and type checks read sibling packages from dist
```

## Commands

| Command                                  | What it does                                                |
| ---------------------------------------- | ----------------------------------------------------------- |
| `pnpm build`                             | Builds every package, in dependency order                   |
| `pnpm typecheck`                         | Type checks every package                                   |
| `pnpm test`                              | Runs every package's tests                                  |
| `pnpm lint` / `pnpm lint:fix`            | oxlint with type-aware rules                                |
| `pnpm format` / `pnpm format:fix`        | Checks / applies oxfmt formatting                           |
| `pnpm knip`                              | Finds unused files, exports and dependencies                |
| `pnpm docs:dev` / `pnpm docs:build`      | Runs / statically builds the docs site                      |
| `pnpm changeset`                         | Writes a changeset ([docs/CHANGESET.md](docs/CHANGESET.md)) |
| `pnpm --filter @imcauan/<name> <script>` | Runs a script in one package                                |

## Branch → PR → release

1. **Branch** from `main`: `<type>/<short-description>`, for example
   `feat/logger-redaction` or `fix/validation-optional-default`.
2. **Commit** in small, conventional commits (below). The `commit-msg` hook
   checks each message.
3. **Add a changeset** if a published package changed
   ([docs/CHANGESET.md](docs/CHANGESET.md)).
4. **Push.** The `pre-push` hook runs format, lint, build, knip, typecheck and
   tests. Fix what fails; never push with `--no-verify`.
5. **Open a PR** to `main`. CI runs the same checks plus
   `changeset status`. The PR title follows the commit convention, because the
   PR is squash-merged with it.
6. **Merge.** The release workflow adds your changeset to the
   "chore: version packages" PR. Merging that PR publishes
   ([docs/RELEASING.md](docs/RELEASING.md)).

## Commit conventions

[Conventional Commits](https://www.conventionalcommits.org), checked by
commitlint with `@commitlint/config-conventional`:

```
<type>(<scope>): <summary in the imperative, lower case>
```

- **Types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`,
  `ci`, `chore`, `revert`, `style`.
- **Scope:** the package's name without the scope (`feat(logger): …`), or the
  area for repo-level changes (`ci`, `docs`, `changeset-cli`). Omit it when
  the change spans the repo.
- **One logical change per commit.** A rename and a fix are two commits.
- Breaking changes in a package still use `feat` or `fix`. The bump is the
  changeset's job ([0.x rules](docs/CHANGESET.md#bump-rules-while-on-0x)).

## Testing local changes in another project

To try an unreleased change in another project (for example, Worksy), pick one
of three ways:

| Way      | Best for                                 | Catch                                  |
| -------- | ---------------------------------------- | -------------------------------------- |
| Link     | Fast iteration on your machine           | Can load two copies of a framework     |
| Tarball  | Checking exactly what would be published | Rebuild and reinstall per change       |
| Snapshot | Another project's CI or deploy           | Needs a pushed branch with a changeset |

### Link

```bash
# here: rebuild dist on every change
pnpm --filter @imcauan/logger dev

# in the other project
pnpm add @imcauan/logger@link:../packages/packages/logger
```

A linked package resolves its imports from its own `node_modules` in this
repo. If it has framework peers (NestJS, React), the other project may end up
with two copies of the framework, which breaks things like NestJS's DI or
React hooks. Use a tarball when that happens.

### Tarball

```bash
# here
pnpm --filter @imcauan/logger build
pnpm --filter @imcauan/logger pack --pack-destination /tmp

# in the other project
pnpm add /tmp/imcauan-logger-0.1.0.tgz
```

The tarball holds exactly the files that would be published, and resolves
peers from the other project like a real install.

### Snapshot

Publish a pre-release under the `next` tag from your branch and install
`@imcauan/logger@next` ([docs/RELEASING.md](docs/RELEASING.md#snapshot-releases)).

### Undo

Point the dependency back at a published version before committing in the
other project:

```bash
pnpm add @imcauan/logger@^0.1.0
```

Never commit a `link:` or file dependency on an `@imcauan/*` package.

## Adding a package

Follow the checklist in
[docs/PACKAGE_GUIDELINES.md](docs/PACKAGE_GUIDELINES.md#adding-a-package).
