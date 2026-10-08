import type { Folder } from 'fumadocs-core/page-tree';

import { buildTree, type TreePage } from '../src/lib/tree';

const page = (path: string, title: string): TreePage => ({
  path,
  title,
  url: `/${title}`,
});

const pages: TreePage[] = [
  page('docs/adr/0002-any.md', 'any-adr-2'),
  page('packages/b-package/README.md', 'b-package'),
  page('docs/RELEASING.md', 'any-releasing'),
  page('README.md', 'any-home'),
  page('docs/adr/README.md', 'any-adr-index'),
  page('packages/a-package/README.md', 'a-package'),
  page('packages/a-package/CHANGELOG.md', 'any-changelog'),
  page('docs/PACKAGE_GUIDELINES.md', 'any-guidelines'),
  page('docs/adr/0001-any.md', 'any-adr-1'),
  page('CONSTITUTION.md', 'any-constitution'),
];

const tabs = (tree: ReturnType<typeof buildTree>) => tree.children as Folder[];

const makeSut = (): typeof buildTree => buildTree;

describe('buildTree', () => {
  it('should make one root folder (sidebar tab) per section, in order', () => {
    const sut = makeSut();

    const tree = sut(pages);

    expect(tabs(tree).map(tab => [tab.name, tab.root])).toEqual([
      ['Overview', true],
      ['Packages', true],
      ['Guides', true],
      ['Decisions', true],
    ]);
  });

  it('should open the Overview tab on the home page', () => {
    const sut = makeSut();

    const [overview] = tabs(sut(pages));

    expect(overview).toMatchObject({
      index: { url: '/any-home' },
      children: [{ name: 'any-constitution' }],
    });
  });

  it('should list packages by name, nesting a package extra pages', () => {
    const sut = makeSut();

    const [, packages] = tabs(sut(pages));

    expect(packages?.children).toEqual([
      {
        type: 'folder',
        name: 'a-package',
        index: { type: 'page', name: 'a-package', url: '/a-package' },
        children: [
          { type: 'page', name: 'any-changelog', url: '/any-changelog' },
        ],
      },
      { type: 'page', name: 'b-package', url: '/b-package' },
    ]);
  });

  it('should order guides by reading order', () => {
    const sut = makeSut();

    const [, , guides] = tabs(sut(pages));

    expect(guides?.children.map(node => node.name)).toEqual([
      'any-guidelines',
      'any-releasing',
    ]);
  });

  it('should open Decisions on the ADR index, then list ADRs by number', () => {
    const sut = makeSut();

    const [, , , decisions] = tabs(sut(pages));

    expect({
      index: decisions?.index?.name,
      adrs: decisions?.children.map(node => node.name),
    }).toEqual({ index: 'any-adr-index', adrs: ['any-adr-1', 'any-adr-2'] });
  });

  it('should give each tab the icon it is passed', () => {
    const sut = makeSut();

    const [overview] = tabs(sut(pages, { overview: 'any-icon' }));

    expect(overview?.icon).toBe('any-icon');
  });
});
