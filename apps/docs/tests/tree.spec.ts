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

const makeSut = (): typeof buildTree => buildTree;

describe('buildTree', () => {
  it('should group pages into sections, in reading order', () => {
    const sut = makeSut();

    const tree = sut(pages);

    expect(tree.children.map(node => node.name)).toEqual([
      'any-home',
      'any-constitution',
      'Packages',
      'a-package',
      'b-package',
      'Guides',
      'any-guidelines',
      'any-releasing',
      'Decisions',
      'any-adr-index',
      'any-adr-1',
      'any-adr-2',
    ]);
  });

  it('should nest a package extra pages under its README', () => {
    const sut = makeSut();

    const tree = sut(pages);

    expect(tree.children.find(node => node.name === 'a-package')).toEqual({
      type: 'folder',
      name: 'a-package',
      index: { type: 'page', name: 'a-package', url: '/a-package' },
      children: [
        { type: 'page', name: 'any-changelog', url: '/any-changelog' },
      ],
    });
  });
});
