import path from 'node:path/posix';

import { githubUrl } from './site';

export type LinkTargets = {
  /** Site URL for each rendered file, keyed by its repository path. */
  pages: ReadonlyMap<string, string>;
  /** Whether a repository path exists, and as what. */
  kind(repoPath: string): 'file' | 'dir' | undefined;
};

export type ResolvedLink = { href: string } | { broken: string };

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Resolves a link found in `fromPath` (a repository path) the way GitHub would,
 * then maps it to the site:
 * - a rendered file → its page URL, keeping the `#hash`;
 * - a folder with a rendered README → that page;
 * - any other existing file or folder → its page on GitHub;
 * - a missing target → `broken`.
 * External links, anchors and absolute paths are returned unchanged.
 */
export function resolveLink(
  fromPath: string,
  href: string,
  targets: LinkTargets,
): ResolvedLink {
  if (EXTERNAL.test(href) || href.startsWith('/')) return { href };

  const [rawPath = '', hash] = href.split('#');
  const target = path
    .normalize(path.join(path.dirname(fromPath), decodeURI(rawPath)))
    .replace(/\/$/, '');
  const suffix = hash === undefined ? '' : `#${hash}`;

  const page =
    targets.pages.get(target) ??
    targets.pages.get(path.join(target, 'README.md'));
  if (page !== undefined) return { href: `${page}${suffix}` };

  const kind = targets.kind(target);
  if (kind) return { href: `${githubUrl(target, kind)}${suffix}` };

  return { broken: href };
}
