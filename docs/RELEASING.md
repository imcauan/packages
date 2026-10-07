# Releasing

Packages are published to [GitHub Packages](https://github.com/imcauan?tab=packages&repo_name=packages)
([ADR 0002](adr/0002-publish-to-github-packages.md)) by GitHub Actions. Nobody
publishes from a laptop.

## Overview

```
feature PR (with changesets) ──merge──▶ main
                                          │
                     release workflow ◀───┘
                          │
       changesets pending? ── yes ──▶ open/update "chore: version packages" PR
                          │
                          no ──▶ publish unpublished versions to GitHub Packages
```

The workflow is `.github/workflows/release.yml` and runs on every push to
`main`.

## The "Version packages" PR

While `main` has changesets, the release workflow keeps one pull request open,
titled **`chore: version packages`**. It runs `pnpm version-packages`
(`changeset version`), which:

- bumps each package's `version` from the changesets;
- updates the ranges of dependents in this repo;
- writes each package's `CHANGELOG.md`, with links to the PR and commit;
- deletes the consumed changeset files.

Every new changeset merged into `main` updates the same PR. Review it like any
other: the versions and changelog entries are what consumers will see.

## Publishing

Merging the version PR pushes to `main` again. This time there are no
changesets, so the workflow runs `pnpm release`:

1. `pnpm build`: every package is built from a clean checkout.
2. `changeset publish`: every package whose `version` isn't on the registry yet
   is published under the `latest` tag, then a git tag
   (`@imcauan/logger@0.2.0`) and a GitHub release are created.

Publishing authenticates with the workflow's `GITHUB_TOKEN`
(`packages: write`); there's no long-lived token.

### First release

Every package starts at `0.1.0` with no changeset. On the first push to `main`
with the release workflow, nothing is pending, so `changeset publish` publishes
all of them at `0.1.0`. Before that push:

- [ ] The repository is `github.com/imcauan/packages`. The package scope must
      match the owner.
- [ ] **Settings → Actions → General → Workflow permissions**: "Read and write
      permissions", and "Allow GitHub Actions to create and approve pull
      requests" (the version PR needs it).
- [ ] After the first publish, set each package's visibility to **public** in
      its package settings if GitHub created it as private.

## Snapshot releases

A snapshot publishes a throwaway pre-release of an unmerged branch under the
`next` tag, so you can try it in another project's CI or deploy before
merging. Normal installs never pick it up.

1. The branch must have changesets (they decide which packages are released).
2. **Actions → Snapshot release → Run workflow**, and pick the branch.
3. The workflow runs `changeset version --snapshot next` and publishes with
   `--tag next`. Versions look like `0.2.0-next-20261007153000`: the version
   the changesets would produce, plus a timestamp.
4. Install it in the other project:

   ```bash
   pnpm add @imcauan/logger@next
   ```

The version changes are never committed, so the branch is untouched. For a
quick loop on your own machine, linking is faster; see
[CONTRIBUTING.md](../CONTRIBUTING.md#testing-local-changes-in-another-project).

## Recovering from a failed release

**Publish failed partway** (network, registry error). Re-run the failed job.
`changeset publish` skips versions that are already on the registry and
publishes the rest. Git tags are only created for packages it published.

**Version PR merged, workflow failed before publishing** (build or test
error). Fix the cause in a normal PR. Its merge re-runs the workflow, which
publishes the versions already in `package.json`. Don't revert the version PR.

**A broken version was published.** Don't delete it; someone may already
depend on it. Publish a fix:

1. Fix it in a PR with a `patch` changeset, merge, and merge the version PR.
2. If consumers need to stop installing the broken version now, mark it
   deprecated:

   ```bash
   npm deprecate @imcauan/logger@0.2.0 "Broken export; use 0.2.1" \
     --registry=https://npm.pkg.github.com
   ```

**`latest` points to the wrong version** (for example, a snapshot published
without `--tag next`). Move the tag back:

```bash
npm dist-tag add @imcauan/logger@0.2.1 latest --registry=https://npm.pkg.github.com
```

**A git tag exists but the version isn't published.** Delete the tag
(`git push --delete origin @imcauan/logger@0.2.0`) and re-run the release job.

The `npm` commands above need a token with `write:packages`; see
[Consuming the packages](../README.md#install).
