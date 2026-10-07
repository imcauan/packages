# Changesets

Versions and changelogs in this repo come from
[Changesets](https://github.com/changesets/changesets). A changeset is a small
Markdown file in `.changeset/` that says which packages a change releases, how
far each one is bumped, and a summary for the changelog.

## When you need one

Every change to a published package needs a changeset
([constitution](../CONSTITUTION.md), rule 9).

A package counts as changed when a file that ends up in its published tarball,
or that shapes it, changes. The patterns live in `.changeset/config.json`
(`changedFilePatterns`):

- `src/**`
- `*.json` (`package.json`, `tsconfig.json`, and the config files of
  `typescript-config`)
- `README.md`
- `tsdown.config.ts`

Changes to tests, `vitest.config.ts` or repo-level files don't need one.
Packages in `tools/` are private and never versioned.

CI runs `changeset status --since=origin/main` on every pull request. It fails
when a published package changed and the branch has no changeset.

> `changeset status` checks that the branch has at least one changeset, not
> that every changed package is listed in one. Listing every changed package
> is on you and on review.

## Bump rules while on `0.x`

All packages are on `0.x` until their API is stable (rule 6). On `0.x`, semver
shifts down one level:

| Bump    | Use for                                                                                                            | Example           |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `patch` | Bug fixes, docs, internal refactors, new things that don't change existing behavior                                | `0.3.1` → `0.3.2` |
| `minor` | Anything that may break a consumer: removed or renamed exports, changed signatures or defaults, raised peer ranges | `0.3.1` → `0.4.0` |
| `major` | Declaring the API stable. Never part of a normal change                                                            | `0.4.0` → `1.0.0` |

When in doubt between `patch` and `minor`, pick `minor`. A `^0.3.1` range only
accepts `0.3.x`, so a `minor` bump never reaches a consumer by surprise.

Packages that depend on a bumped package in this repo (for example,
`environment` depends on `validation`) get their dependency range updated and
a `patch` bump automatically. Run `pnpm changeset status --verbose` to see the
full release plan.

## Writing one by hand

```bash
pnpm changeset
```

The prompt asks which packages changed, the bump for each, and a summary. It
writes `.changeset/<random-name>.md`:

```md
---
'@imcauan/logger': minor
'@imcauan/environment': patch
---

Rename `LoggerConfig.env` to `environment`.
```

Commit it with your change (`chore: add changeset`, or in the same commit).

### Writing the summary

- Write for the person reading the changelog, not the reviewer: what changed
  for them, and what to do about it.
- Start with a verb: "Add", "Fix", "Rename", "Remove".
- For a `minor` that breaks something, say how to migrate.
- The first line becomes the changelog entry; more lines are kept as detail.

### Editing or removing one

A changeset is a plain file. Edit the front matter or summary directly, or
delete the file, and commit. Nothing else tracks it.

### More than one

A branch can have several changesets, for example one per logical change.
When versions are calculated, each package gets the highest bump across all
changesets that list it.

### Changes that don't need a release

If a published package changed but shouldn't be released (say, a comment typo
in `src/`), add an empty changeset so CI passes:

```bash
pnpm changeset --empty
```

## Automated pre-push step

> **Planned.** Phase 3 adds a pre-push step that drafts a changeset with an AI
> model when the branch changes a published package and has none. This section
> will document its environment variables, flags and escape hatches.
