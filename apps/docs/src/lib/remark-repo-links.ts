import path from 'node:path';

import type { Nodes, Root } from 'mdast';

import { resolveLink, type LinkTargets } from './resolve-link';

type Options = {
  /** Absolute path of the repository root. */
  root: string;
  targets: LinkTargets;
};

type LinkLike = Extract<Nodes, { url: string }>;

function collectLinks(node: Nodes, found: LinkLike[]): LinkLike[] {
  if ('url' in node && typeof node.url === 'string') found.push(node);
  if ('children' in node) {
    for (const child of node.children) collectLinks(child, found);
  }
  return found;
}

/**
 * Rewrites the relative links in a repository Markdown file to site URLs, or
 * to GitHub for files the site doesn't render, and fails the build on links
 * whose target doesn't exist.
 */
export function remarkRepoLinks({ root, targets }: Options) {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path) return;
    const fromPath = path.relative(root, file.path).split(path.sep).join('/');
    const broken: string[] = [];

    for (const node of collectLinks(tree, [])) {
      const resolved = resolveLink(fromPath, node.url, targets);
      if ('href' in resolved) node.url = resolved.href;
      else broken.push(resolved.broken);
    }

    if (broken.length > 0) {
      throw new Error(
        `Broken links in ${fromPath}:\n${broken.map(link => `  - ${link}`).join('\n')}`,
      );
    }
  };
}
