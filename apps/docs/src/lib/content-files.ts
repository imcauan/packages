import { globSync, statSync } from 'node:fs';
import path from 'node:path';

import { slugsFor } from './content';
import type { LinkTargets } from './resolve-link';

/** The repository root, two levels above this app. */
export const repoRoot = path.resolve(import.meta.dirname, '../../../..');

/**
 * The Markdown files the site renders, relative to the repository root.
 * Keep in sync with `files` in `source.ts`, which must be string literals
 * there (tests/content-files.spec.ts checks they match).
 */
export const contentFiles = [
  'README.md',
  'CONSTITUTION.md',
  'CONTRIBUTING.md',
  'docs/*.md',
  'docs/adr/*.md',
  'packages/*/README.md',
  'packages/*/docs/**/*.md',
  'packages/*/CHANGELOG.md',
];

const urlFor = (repoPath: string): string => `/${slugsFor(repoPath).join('/')}`;

/** Link targets for the whole repository: every rendered page, and fs lookups. */
export function repoLinkTargets(root = repoRoot): LinkTargets {
  const pages = new Map(
    globSync(contentFiles, { cwd: root }).map(file => [
      file.split(path.sep).join('/'),
      urlFor(file),
    ]),
  );

  return {
    pages,
    kind: repoPath => {
      try {
        return statSync(path.join(root, repoPath)).isDirectory()
          ? 'dir'
          : 'file';
      } catch {
        return undefined;
      }
    },
  };
}
