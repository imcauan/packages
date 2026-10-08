import { validateDraft, type KnownPackages } from '../src/validate.ts';

const known: KnownPackages = {
  workspace: new Set([
    '@imcauan/logger',
    '@imcauan/validation',
    '@tools/changeset',
  ]),
  published: new Set(['@imcauan/logger', '@imcauan/validation']),
  changed: new Set(['@imcauan/logger']),
};

const makeSut = (): typeof validateDraft => validateDraft;

describe('validateDraft', () => {
  it('should accept a valid draft', () => {
    const sut = makeSut();

    const result = sut(
      {
        releases: [{ name: '@imcauan/logger', bump: 'minor' }],
        summary: ' Add any feature. ',
      },
      known,
    );

    expect(result).toEqual({
      valid: true,
      draft: {
        releases: [{ name: '@imcauan/logger', bump: 'minor' }],
        summary: 'Add any feature.',
      },
    });
  });

  it.each([null, 'any-text', ['any-item']])('should reject %j', candidate => {
    const sut = makeSut();

    const result = sut(candidate, known);

    expect(result).toEqual({
      valid: false,
      problems: ['the answer is not a JSON object'],
    });
  });

  it('should reject a draft with no packages', () => {
    const sut = makeSut();

    const result = sut({ releases: [], summary: 'any-summary' }, known);

    expect(result).toEqual({
      valid: false,
      problems: ['it lists no packages'],
    });
  });

  it('should reject a package outside the workspace', () => {
    const sut = makeSut();

    const result = sut(
      {
        releases: [{ name: 'any-package', bump: 'patch' }],
        summary: 'any-summary',
      },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: ['"any-package" is not a package in this workspace'],
    });
  });

  it('should reject a private package', () => {
    const sut = makeSut();

    const result = sut(
      {
        releases: [{ name: '@tools/changeset', bump: 'patch' }],
        summary: 'any-summary',
      },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: ['"@tools/changeset" is private and never published'],
    });
  });

  it('should reject a published package the branch did not change', () => {
    const sut = makeSut();

    const result = sut(
      {
        releases: [{ name: '@imcauan/validation', bump: 'patch' }],
        summary: 'any-summary',
      },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: ['"@imcauan/validation" didn\'t change on this branch'],
    });
  });

  it('should reject an unknown bump', () => {
    const sut = makeSut();

    const result = sut(
      {
        releases: [{ name: '@imcauan/logger', bump: 'prerelease' }],
        summary: 'any-summary',
      },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: [
        '"@imcauan/logger" has bump "prerelease"; expected patch, minor or major',
      ],
    });
  });

  it('should reject a package listed twice', () => {
    const sut = makeSut();

    const result = sut(
      {
        releases: [
          { name: '@imcauan/logger', bump: 'patch' },
          { name: '@imcauan/logger', bump: 'minor' },
        ],
        summary: 'any-summary',
      },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: ['"@imcauan/logger" is listed twice'],
    });
  });

  it('should reject a release without a name', () => {
    const sut = makeSut();

    const result = sut(
      { releases: [{ bump: 'patch' }], summary: 'any-summary' },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: ['a release has no package name'],
    });
  });

  it('should reject an empty summary', () => {
    const sut = makeSut();

    const result = sut(
      { releases: [{ name: '@imcauan/logger', bump: 'patch' }], summary: '  ' },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: ['the summary is empty'],
    });
  });

  it('should report every problem at once', () => {
    const sut = makeSut();

    const result = sut(
      { releases: [{ name: 'any-package', bump: 'patch' }] },
      known,
    );

    expect(result).toEqual({
      valid: false,
      problems: [
        '"any-package" is not a package in this workspace',
        'the summary is empty',
      ],
    });
  });
});
