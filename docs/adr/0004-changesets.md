# ADR 0004: Version and release with Changesets

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Each package is versioned independently and stays on `0.x` until its API is
stable. Versions, changelogs and the dependency ranges between packages must
stay consistent without manual bookkeeping. Publishing must happen in CI, not
from a laptop.

## Decision

Use [Changesets](https://github.com/changesets/changesets):

- Each change to a published package comes with a changeset: the packages, a
  bump per package, and a summary.
- Any file change inside a package counts as a change. Changes that shouldn't
  be released (tests only, for example) use an empty changeset.
- Packages in `tools/` are private and ignored (`privatePackages` off).
- `changesets/action` keeps a "chore: version packages" PR open and publishes
  when it's merged ([RELEASING.md](../RELEASING.md)).
- Changelog entries link to their PR and commit
  (`@changesets/changelog-github`, without the "Thanks @user" credit, since
  there's one maintainer).
- CI fails a pull request that changes a published package without a
  changeset.

## Consequences

- Versions and changelogs are reviewed in a PR before anything is published.
- Contributors write a changeset per change. Phase 3 adds a pre-push step that
  drafts one when it's missing.
- Generating changelog links needs a GitHub token, so `changeset version` runs
  in CI, not locally.
- `changeset status` checks that a branch has a changeset, not that it covers
  every changed package. Review covers the rest.
