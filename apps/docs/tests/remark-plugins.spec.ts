import type { Link, Root } from 'mdast';

import { remarkRepoLinks } from '../src/lib/remark-repo-links';
import { remarkStripTitle } from '../src/lib/remark-strip-title';
import type { LinkTargets } from '../src/lib/resolve-link';

const targets: LinkTargets = {
  pages: new Map([['docs/TESTING.md', '/guides/testing']]),
  kind: () => undefined,
};

const makeTree = (...children: Root['children']): Root => ({
  type: 'root',
  children,
});

const link = (url: string): Link => ({
  type: 'link',
  url,
  children: [{ type: 'text', value: 'any-text' }],
});

describe('remarkStripTitle', () => {
  const makeSut = () => remarkStripTitle();

  it('should remove a leading H1', () => {
    const sut = makeSut();
    const tree = makeTree(
      {
        type: 'heading',
        depth: 1,
        children: [{ type: 'text', value: 'any-title' }],
      },
      { type: 'paragraph', children: [{ type: 'text', value: 'any-text' }] },
    );

    sut(tree);

    expect(tree.children.map(node => node.type)).toEqual(['paragraph']);
  });

  it('should keep a leading H2', () => {
    const sut = makeSut();
    const tree = makeTree({ type: 'heading', depth: 2, children: [] });

    sut(tree);

    expect(tree.children).toHaveLength(1);
  });
});

describe('remarkRepoLinks', () => {
  const makeSut = () => remarkRepoLinks({ root: '/any/root', targets });

  it('should rewrite nested links to site URLs', () => {
    const sut = makeSut();
    const tree = makeTree({
      type: 'paragraph',
      children: [link('TESTING.md')],
    });

    sut(tree, { path: '/any/root/docs/CHANGESET.md' });

    expect(tree).toMatchObject({
      children: [{ children: [{ url: '/guides/testing' }] }],
    });
  });

  it('should fail with every broken link in the file', () => {
    const sut = makeSut();
    const tree = makeTree({
      type: 'paragraph',
      children: [link('any-missing.md'), link('any-other-missing.md')],
    });

    const run = () => sut(tree, { path: '/any/root/docs/CHANGESET.md' });

    expect(run).toThrow(
      'Broken links in docs/CHANGESET.md:\n  - any-missing.md\n  - any-other-missing.md',
    );
  });
});
