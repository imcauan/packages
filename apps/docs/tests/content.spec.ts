import { descriptionFrom, slugsFor, titleFrom } from '../src/lib/content';

describe('slugsFor', () => {
  const makeSut = (): typeof slugsFor => slugsFor;

  it.each([
    ['README.md', []],
    ['CONSTITUTION.md', ['constitution']],
    ['docs/PACKAGE_GUIDELINES.md', ['guides', 'package-guidelines']],
    ['docs/adr/README.md', ['adr']],
    ['docs/adr/0002-any-decision.md', ['adr', '0002-any-decision']],
    ['packages/any-package/README.md', ['packages', 'any-package']],
    [
      'packages/any-package/CHANGELOG.md',
      ['packages', 'any-package', 'changelog'],
    ],
    [
      'packages/any-package/docs/INTERNAL_FLOW.md',
      ['packages', 'any-package', 'internal-flow'],
    ],
  ])('should map %s to %j', (repoPath, slugs) => {
    const sut = makeSut();

    const result = sut(repoPath);

    expect(result).toEqual(slugs);
  });
});

describe('titleFrom', () => {
  const makeSut = (): typeof titleFrom => titleFrom;

  it('should return the first H1 without code marks', () => {
    const sut = makeSut();

    const title = sut('intro\n\n# `@any/package`\n\n## any-subtitle');

    expect(title).toBe('@any/package');
  });

  it('should return undefined without an H1', () => {
    const sut = makeSut();

    const title = sut('## any-subtitle');

    expect(title).toBeUndefined();
  });
});

describe('descriptionFrom', () => {
  const makeSut = (): typeof descriptionFrom => descriptionFrom;

  it('should return the first paragraph after the title as plain text', () => {
    const sut = makeSut();

    const description = sut(
      '# any-title\n\nAny `code` with a [link](any-url) and **bold**.\n\nAny second paragraph.',
    );

    expect(description).toBe('Any code with a link and bold.');
  });

  it('should skip badges, lists and code blocks', () => {
    const sut = makeSut();

    const description = sut(
      '# any-title\n\n[![any-badge](any-url)](any-url)\n\n- any-item\n\n```ts\nany-code\n```\n\nAny prose.',
    );

    expect(description).toBe('Any prose.');
  });

  it('should join a paragraph that spans several lines', () => {
    const sut = makeSut();

    const description = sut('# any-title\n\nAny first line\nany second line.');

    expect(description).toBe('Any first line any second line.');
  });
});
