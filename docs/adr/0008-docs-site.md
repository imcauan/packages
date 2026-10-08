# ADR 0008: A docs site rendered from the repository's Markdown

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

The packages' documentation already lives in the repository as Markdown: one
README per package, the guides in `docs/`, the ADRs, the constitution and the
contributing guide. GitHub renders it, but it isn't navigable or searchable
as a whole. A docs site helps, as long as it doesn't become a second copy of
the docs to keep in sync.

## Decision

- **Next.js with Fumadocs**, in a private app at `apps/docs`. Fumadocs
  supplies the docs layout, the Markdown pipeline and search.
- **The site reads the files where they are.** One content collection points
  at the repository root and selects the docs with globs. Nothing is copied,
  and no file gets frontmatter: titles and descriptions come from each file's
  H1 and first paragraph.
- **Links work the same on GitHub and on the site.** Relative links are written
  for GitHub. At build time they're rewritten:
  - a link to a rendered file becomes its page URL;
  - a link to any other file or folder points to GitHub;
  - a link to a file that doesn't exist fails the build.
- **Static site generation.**
  - `output: 'export'` pre-renders every page with `generateStaticParams`, and
    `dynamicParams` is off.
  - The search index and sitemap are generated at build time.
  - No server runs.
- **Hosted on GitHub Pages.** A workflow builds with the `/packages` base path
  and deploys on pushes to `main` that touch a doc or the app. CI builds the
  site on every pull request.

## Consequences

- Docs are edited in one place, in plain Markdown that still reads well on
  GitHub. The site updates itself on merge.
- A new package or ADR appears on the site and in the sidebar without changing
  the app.
- Every relative link in every doc is checked on each pull request.
- Docs keep GitHub-style Markdown: no MDX components, so pages can't use
  interactive Fumadocs features unless the source file opts into MDX.
- The `files` globs in `source.ts` must be string literals, so the pattern list
  appears twice in the app. A unit test keeps the two in sync.
