/** Where the site and its sources live. */
export const site = {
  name: '@imcauan/packages',
  repository: 'imcauan/packages',
  branch: 'main',
  url: 'https://imcauan.github.io/packages',
  /** `/packages` on GitHub Pages, empty locally (see next.config.mjs). */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
};

/** The file's page on GitHub: `blob` for files, `tree` for folders. */
export function githubUrl(
  repoPath: string,
  kind: 'file' | 'dir' = 'file',
): string {
  const view = kind === 'dir' ? 'tree' : 'blob';
  return `https://github.com/${site.repository}/${view}/${site.branch}/${repoPath}`;
}
