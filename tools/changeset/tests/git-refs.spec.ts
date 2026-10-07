import { parsePushRefs } from '../src/git.ts';

const sha = (char: string) => char.repeat(40);

const makeSut = (): typeof parsePushRefs => parsePushRefs;

describe('parsePushRefs', () => {
  it('should parse a branch update', () => {
    const sut = makeSut();

    const refs = sut(
      `refs/heads/any-branch ${sha('a')} refs/heads/any-branch ${sha('b')}\n`,
    );

    expect(refs).toEqual([
      {
        localRef: 'refs/heads/any-branch',
        localSha: sha('a'),
        remoteRef: 'refs/heads/any-branch',
        remoteSha: sha('b'),
      },
    ]);
  });

  it('should ignore tags', () => {
    const sut = makeSut();

    const refs = sut(`refs/tags/v1 ${sha('a')} refs/tags/v1 ${sha('0')}\n`);

    expect(refs).toEqual([]);
  });

  it('should ignore branch deletions', () => {
    const sut = makeSut();

    const refs = sut(
      `(delete) ${sha('0')} refs/heads/any-branch ${sha('b')}\n`,
    );

    expect(refs).toEqual([]);
  });

  it('should ignore empty input', () => {
    const sut = makeSut();

    const refs = sut('');

    expect(refs).toEqual([]);
  });
});
