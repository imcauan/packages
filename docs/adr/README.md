# Architecture decision records

One file per decision: context, decision, consequences. A decision is never
edited after it's accepted; a new ADR supersedes it and links back.

| ADR                                              | Decision                                            |
| ------------------------------------------------ | --------------------------------------------------- |
| [0001](0001-pnpm-monorepo.md)                    | One pnpm monorepo for all packages                  |
| [0002](0002-publish-to-github-packages.md)       | Publish to GitHub Packages                          |
| [0003](0003-framework-free-core-and-subpaths.md) | Framework-free core, framework glue in subpaths     |
| [0004](0004-changesets.md)                       | Version and release with Changesets                 |
| [0005](0005-build-with-tsdown.md)                | Build with tsdown, ESM only, no Turborepo           |
| [0006](0006-changeset-generator-port.md)         | Changeset providers behind a port                   |
| [0007](0007-github-packages-optional-peers.md)   | Optional peers on GitHub Packages                   |
| [0008](0008-docs-site.md)                        | A docs site rendered from the repository's Markdown |

To add one, copy the newest file, take the next number, and add it to this
table.
