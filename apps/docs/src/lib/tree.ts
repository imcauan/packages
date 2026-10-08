import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

/** What the sidebar needs from a page. */
export type TreePage = {
  /** Path relative to the repository root, e.g. `packages/logger/README.md`. */
  path: string;
  url: string;
  title: string;
};

/** The sidebar tabs, in order. */
export type TabId = 'overview' | 'packages' | 'guides' | 'decisions';

const TABS: Record<TabId, { name: string; description: string }> = {
  overview: { name: 'Overview', description: 'Start here' },
  packages: { name: 'Packages', description: 'The @imcauan/* packages' },
  guides: { name: 'Guides', description: 'How the repo works' },
  decisions: {
    name: 'Decisions',
    description: 'Architecture decision records',
  },
};

/** Guides in reading order; any guide not listed follows, by title. */
const GUIDE_ORDER = [
  'docs/PACKAGE_GUIDELINES.md',
  'docs/TESTING.md',
  'docs/CHANGESET.md',
  'docs/RELEASING.md',
];

const item = (page: TreePage): Item => ({
  type: 'page',
  name: page.title,
  url: page.url,
});

const byTitle = (a: TreePage, b: TreePage) => a.title.localeCompare(b.title);

function packageNode(readme: TreePage, pages: readonly TreePage[]): Node {
  const folder = readme.path.slice(0, -'README.md'.length);
  const subpages = pages
    .filter(page => page.path.startsWith(folder) && page !== readme)
    .sort(byTitle);
  if (subpages.length === 0) return item(readme);

  const node: Folder = {
    type: 'folder',
    name: readme.title,
    index: item(readme),
    children: subpages.map(item),
  };
  return node;
}

/**
 * The sidebar as four tabs (root folders, which Fumadocs shows as a tab
 * switcher): Overview (home, constitution, contributing), Packages (one entry
 * per package, its extra pages nested), Guides, and Decisions (the ADR index,
 * then ADRs by number). Packages and ADRs are discovered from the pages, so
 * new ones need no change here.
 */
export function buildTree(
  pages: readonly TreePage[],
  icons: Partial<Record<TabId, ReactNode>> = {},
): Root {
  const at = (path: string) => pages.find(page => page.path === path);
  const present = (page: TreePage | undefined): page is TreePage =>
    page !== undefined;

  // Fumadocs matches tabs to their folders by `$id`; without one, every
  // folder matches the first tab and the switcher shows the wrong options.
  const tab = (id: TabId, children: Node[], index?: TreePage): Folder => ({
    $id: id,
    type: 'folder',
    root: true,
    ...TABS[id],
    icon: icons[id],
    ...(index ? { index: item(index) } : {}),
    children,
  });

  const [home, ...overview] = [
    'README.md',
    'CONSTITUTION.md',
    'CONTRIBUTING.md',
  ]
    .map(at)
    .filter(present);

  const packages = pages
    .filter(page => /^packages\/[^/]+\/README\.md$/.test(page.path))
    .sort(byTitle)
    .map(readme => packageNode(readme, pages));

  const guides = pages
    .filter(page => /^docs\/[^/]+\.md$/.test(page.path))
    .sort((a, b) => {
      const rank = (page: TreePage) => {
        const index = GUIDE_ORDER.indexOf(page.path);
        return index === -1 ? GUIDE_ORDER.length : index;
      };
      return rank(a) - rank(b) || byTitle(a, b);
    });

  const adrs = pages
    .filter(page => /^docs\/adr\/\d+[^/]*\.md$/.test(page.path))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    name: 'Docs',
    children: [
      tab('overview', overview.map(item), home),
      tab('packages', packages),
      tab('guides', guides.map(item)),
      tab('decisions', adrs.map(item), at('docs/adr/README.md')),
    ],
  };
}
