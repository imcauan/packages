import { resolveLink, type LinkTargets } from '../src/lib/resolve-link';

const existing = new Map<string, 'file' | 'dir'>([
  ['LICENSE', 'file'],
  ['tools/any-tool', 'dir'],
]);

const targets: LinkTargets = {
  pages: new Map([
    ['README.md', '/'],
    ['docs/TESTING.md', '/guides/testing'],
    ['packages/any-package/README.md', '/packages/any-package'],
  ]),
  kind: repoPath => existing.get(repoPath),
};

const makeSut = (): typeof resolveLink => resolveLink;

describe('resolveLink', () => {
  it('should map a rendered file to its page', () => {
    const sut = makeSut();

    const result = sut('docs/CHANGESET.md', 'TESTING.md', targets);

    expect(result).toEqual({ href: '/guides/testing' });
  });

  it('should keep the hash', () => {
    const sut = makeSut();

    const result = sut(
      'docs/CHANGESET.md',
      '../README.md#any-section',
      targets,
    );

    expect(result).toEqual({ href: '/#any-section' });
  });

  it('should map a folder to its README page', () => {
    const sut = makeSut();

    const result = sut('README.md', 'packages/any-package', targets);

    expect(result).toEqual({ href: '/packages/any-package' });
  });

  it('should send an unrendered file to GitHub', () => {
    const sut = makeSut();

    const result = sut('docs/TESTING.md', '../LICENSE', targets);

    expect(result).toEqual({
      href: 'https://github.com/imcauan/packages/blob/main/LICENSE',
    });
  });

  it('should send an unrendered folder to GitHub', () => {
    const sut = makeSut();

    const result = sut('README.md', 'tools/any-tool/', targets);

    expect(result).toEqual({
      href: 'https://github.com/imcauan/packages/tree/main/tools/any-tool',
    });
  });

  it('should report a link whose target does not exist', () => {
    const sut = makeSut();

    const result = sut('README.md', 'any-missing.md', targets);

    expect(result).toEqual({ broken: 'any-missing.md' });
  });

  it.each([
    'https://any.url',
    'mailto:any@email.com',
    '#any-anchor',
    '/any-absolute',
  ])('should leave %s unchanged', href => {
    const sut = makeSut();

    const result = sut('README.md', href, targets);

    expect(result).toEqual({ href });
  });
});
