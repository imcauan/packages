# ADR 0002: Publish to GitHub Packages

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The packages are public and open source, under the `@imcauan` scope. They can
be published to the public npm registry (npmjs.com) or to GitHub Packages
(`npm.pkg.github.com`). On GitHub Packages, a package's scope must match the
GitHub account that owns the repository: `@imcauan` maps to the `imcauan`
account.

## Decision

Publish every package to GitHub Packages:

- Each package sets `publishConfig.registry` to `https://npm.pkg.github.com`
  and a `repository` field, which links the package to this repository.
- The release workflow authenticates with its own `GITHUB_TOKEN`
  (`packages: write`). No long-lived publish token is stored.
- The source repository is `github.com/imcauan/packages`.

## Consequences

- Packages, source, releases and CI live in one place, under one account.
- Publishing needs no extra secret.
- **Installing requires authentication, even for public packages.**
  Consumers add a `.npmrc` that maps `@imcauan` to GitHub Packages and a
  personal access token with `read:packages`. The root README documents it.
- **Consumers' CI and deploy builds need that token too.** For a repository
  owned by another account or organization, store a token as a secret, or
  grant the repository access in each package's settings (that works for
  GitHub Actions only).
- **No npm provenance.** npm's provenance statements are an npmjs.com feature.
- Registry badges from npmjs.com don't apply; the README uses GitHub-based
  badges.
- Moving to npmjs.com later means changing `publishConfig` and the release
  workflow, and asking consumers to drop the scope mapping. Versions published
  here stay here.
