// How a repository Markdown file becomes a page: its URL segments, title and
// description. Pure functions of the file's path and text, so the mapping is
// testable without building the site.

const toSegment = (name: string): string =>
  name.replace(/\.md$/i, '').toLowerCase().replaceAll('_', '-');

/**
 * URL segments for a file, from its path relative to the repository root.
 *
 * | File                              | Segments                          |
 * | --------------------------------- | --------------------------------- |
 * | `README.md`                       | `[]` (home)                       |
 * | `CONSTITUTION.md`                 | `['constitution']`                |
 * | `docs/TESTING.md`                 | `['guides', 'testing']`           |
 * | `docs/adr/README.md`              | `['adr']`                         |
 * | `docs/adr/0002-x.md`              | `['adr', '0002-x']`               |
 * | `packages/logger/README.md`       | `['packages', 'logger']`          |
 * | `packages/logger/CHANGELOG.md`    | `['packages', 'logger', 'changelog']` |
 * | `packages/x/docs/INTERNAL_FLOW.md`| `['packages', 'x', 'internal-flow']`  |
 */
export function slugsFor(repoPath: string): string[] {
  const parts = repoPath.split('/');
  const [first, second] = parts;
  const file = parts.at(-1) ?? repoPath;

  if (parts.length === 1) {
    return file === 'README.md' ? [] : [toSegment(file)];
  }
  if (first === 'docs' && second === 'adr') {
    return file === 'README.md' ? ['adr'] : ['adr', toSegment(file)];
  }
  if (first === 'docs') {
    return ['guides', ...parts.slice(1).map(toSegment)];
  }
  if (first === 'packages' && second) {
    if (file === 'README.md' && parts.length === 3) return ['packages', second];
    const rest = parts.slice(2).filter(part => part !== 'docs');
    return ['packages', second, ...rest.map(toSegment)];
  }
  return parts.map(toSegment);
}

/** The text of the first `# H1`, without Markdown code marks. */
export function titleFrom(markdown: string): string | undefined {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.replaceAll('`', '').trim();
}

/**
 * The first prose paragraph after the title, as plain text: skips badges,
 * headings, tables, lists, quotes and code.
 */
export function descriptionFrom(markdown: string): string | undefined {
  const afterTitle = markdown.replace(/^[\s\S]*?^#\s+.+$/m, '');
  const paragraphs = afterTitle.split(/\n\s*\n/).map(block => block.trim());
  const prose = paragraphs.find(
    block => block !== '' && !/^(#|\[!\[|!\[|\||-|\*|>|```|\d+\.)/.test(block),
  );
  return prose
    ?.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replaceAll('`', '')
    .replaceAll('**', '')
    .replace(/\s+/g, ' ')
    .trim();
}
