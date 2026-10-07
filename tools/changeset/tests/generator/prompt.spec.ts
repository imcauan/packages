import { buildMessages } from '../../src/generator/prompt.ts';

const makeSut = (): typeof buildMessages => buildMessages;

describe('buildMessages', () => {
  it('should send the rules as the system message', () => {
    const sut = makeSut();

    const [system] = sut({ changedPackages: [], commits: [], diff: '' });

    expect(system?.content).toContain('All packages are on 0.x');
  });

  it('should list the changed packages, commits and diff', () => {
    const sut = makeSut();

    const [, user] = sut({
      changedPackages: ['@imcauan/logger'],
      commits: ['feat(logger): any change'],
      diff: 'any-diff',
    });

    expect(user?.content).toBe(
      [
        '## Changed packages',
        '- @imcauan/logger',
        '',
        '## Commits',
        '- feat(logger): any change',
        '',
        '## Diff',
        '```diff',
        'any-diff',
        '```',
      ].join('\n'),
    );
  });

  it('should say when there are no commits', () => {
    const sut = makeSut();

    const [, user] = sut({ changedPackages: [], commits: [], diff: '' });

    expect(user?.content).toContain('## Commits\n(none)');
  });
});
