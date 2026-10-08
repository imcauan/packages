# Changesets

Versions and changelogs in this repo come from
[Changesets](https://github.com/changesets/changesets). A changeset is a small
Markdown file in `.changeset/` that says which packages a change releases, how
far each one is bumped, and a summary for the changelog.

## When you need one

Every change to a published package needs a changeset
([constitution](../CONSTITUTION.md), rule 9).

A package counts as changed when any file in its folder changes, tests
included. When a change doesn't need a release (tests, a comment typo), add
an [empty changeset](#changes-that-dont-need-a-release). Packages in `tools/`
are private and never versioned.

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

If a published package changed but shouldn't be released (say, a test or a
comment typo), add an empty changeset so CI passes:

```bash
pnpm changeset --empty
```

## Automated pre-push step

When you push a branch that changes a published package and has no changeset,
the pre-push hook drafts one with an AI model. It runs after format, lint,
build, knip, typecheck and tests pass.

```
┌   imcauan  changeset pre-push
│
◇  Changes found · @imcauan/logger
│
◇  Model · Gemini · gemini-3.8-flash · only provider
│
◇  Drafting changeset                                              1.8s
│
│  ╭──────────────────────────────────────────────────────────────╮
│  │ @imcauan/logger                                        patch │
│  ├──────────────────────────────────────────────────────────────┤
│  │ Clarify when `traceMixin` adds no trace fields.              │
│  ╰──────────────────────────────────────────────────────────────╯
│
◇  Committed .changeset/spotty-cycles-roll.md
│
◇  Pushing again with SKIP_CHANGESET=1 · all checks run once more  20.2s
│
└  Pushed. Git reports this push as failed because the second push replaced it; that's expected.
```

### What it does

1. Compares the branch with `origin/main` (or `main`) and finds the published
   packages it changed, with the same rules as `changeset status`.
2. Sends the changed packages, the branch's commit subjects and its diff for
   those packages (without changelogs and `dist`, cut at 120,000 characters)
   to the model, and asks for JSON: packages, a bump each, a summary.
3. Checks the answer: every package exists in the workspace, is published and
   changed on this branch (Changesets bumps dependents itself), no package
   appears twice, every bump is `patch`, `minor` or `major`, and the summary
   isn't empty. An invalid answer is retried once.
4. Asks before keeping a `major` bump. Without a terminal it stops instead.
5. Writes `.changeset/<random-name>.md`, commits it as `chore: add changeset`,
   and runs `git push` again with `SKIP_CHANGESET=1`, so every check runs
   once more on the new commit. It never uses `--no-verify`.
6. Exits with an error so git doesn't push the original refs too. Git then
   prints "failed to push some refs"; the second push already went through.

Read the drafted changeset like any other: edit or replace it in a follow-up
commit if the summary isn't right.

### When it skips

It prints one dim line and lets the push continue when:

- the branch already has a changeset;
- no published package changed (only `tools/` or repo-level files, for
  example);
- the branch is a `changeset-release/*` branch (the version PR);
- `SKIP_CHANGESET=1` is set;
- the push updates no branch (tags only, or deletions).

### Setup

| Variable                | Default                                                    |                                                                                                           |
| ----------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `CHANGESET_AI_API_KEY`  | none                                                       | Required. A key for the provider; for Gemini, from [Google AI Studio](https://aistudio.google.com/apikey) |
| `CHANGESET_AI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/` | Any OpenAI-compatible endpoint                                                                            |
| `CHANGESET_AI_MODEL`    | `gemini-3.8-flash`                                         | The model id at that endpoint                                                                             |

Put them in a `.env` file at the repository root (git-ignored), or export
them in your shell; a value exported in the shell wins. Without
`CHANGESET_AI_API_KEY` the step stops the push and tells you what to do.

```ini
# .env
CHANGESET_AI_API_KEY=your-key
```

### Flags

The hook runs the tool without flags. Run it yourself to try a draft or to
debug:

```bash
pnpm --filter @tools/changeset start --dry-run
```

| Flag           | Prompt it replaces          | Effect                                                                        |
| -------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `--model <id>` | The model picker            | Uses that provider. Gemini is the only one for now, so the picker never shows |
| `--yes`        | The major-bump confirmation | Keeps a `major` bump without asking                                           |
| `--dry-run`    |                             | Prints the changeset; writes and commits nothing                              |
| `--debug`      |                             | Prints stack traces for unexpected errors                                     |

Prompts read from `/dev/tty`, because the hook's stdin carries git's list of
refs. In a GUI git client or an agent, where there's no terminal, prompts are
skipped: the picker takes the default provider, and a `major` bump stops the
push.

### When it fails

On a network error, a rejected key, a quota or rate limit, or an invalid
answer after the retry, the step prints what failed and why, and stops the
push. Then either:

- write the changeset by hand: `pnpm changeset`; or
- push without one: `SKIP_CHANGESET=1 git push`. CI's `changeset status`
  still requires a changeset before the PR can merge.

### Adding a provider

Providers are adapters behind the `ChangesetGenerator` port
([ADR 0006](adr/0006-changeset-generator-port.md)). A provider with an
OpenAI-compatible endpoint (Groq, OpenRouter, a local server) needs only an
entry in `tools/changeset/src/generator/providers.ts`; one without needs an
adapter next to `openai-compatible.adapter.ts`. With more than one provider,
the picker appears.
