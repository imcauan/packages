import { describe, expect, it } from 'vitest';

import { Reporter } from '../../src/ui/reporter.ts';
import { createTheme } from '../../src/ui/theme.ts';
import { MemoryOutput } from '../mocks/memory-output.ts';

type SutTypes = { sut: Reporter; output: MemoryOutput };

const makeSut = (): SutTypes => {
  const output = new MemoryOutput();
  let time = 0;
  const sut = new Reporter({
    output,
    theme: createTheme({ color: false }),
    now: () => (time += 1200),
  });
  return { sut, output };
};

describe('Reporter', () => {
  it('should open the rail with the header', () => {
    const { sut, output } = makeSut();

    sut.header();

    expect(output.text).toBe('┌   imcauan  changeset pre-push\n');
  });

  it('should print a step with its detail after a dot', () => {
    const { sut, output } = makeSut();

    sut.step('any-label', { detail: 'any-detail' });

    expect(output.text).toBe('│\n◇  any-label · any-detail\n');
  });

  it('should align the duration of a finished task to the right', async () => {
    const { sut, output } = makeSut();

    await sut.task('any-label', async () => 'any-result');

    expect(output.text.split('\n')[1]).toBe(
      `◇  any-label${' '.repeat(56)}1.2s`,
    );
  });

  it('should return the task result', async () => {
    const { sut } = makeSut();

    const result = await sut.task('any-label', async () => 'any-result');

    expect(result).toBe('any-result');
  });

  it('should print what failed, why and what to do next', () => {
    const { sut, output } = makeSut();

    sut.error({
      what: 'any-what',
      why: 'any-why',
      next: [{ command: 'any-command', description: 'any-description' }],
    });

    expect(output.text).toBe(
      [
        '│',
        '■  any-what',
        '│  any-why',
        '│',
        '│  What to do next:',
        '│    any-command  any-description',
        '│',
        '└  Push stopped.',
        '',
      ].join('\n'),
    );
  });

  it('should not draw two rail lines in a row', async () => {
    const { sut, output } = makeSut();
    const failing = sut.task('any-label', async () => {
      throw new Error('any-message');
    });
    await failing.catch(() => {});

    sut.error({ what: 'any-what', why: 'any-why', next: [] });

    expect(output.text.startsWith('│\n■  any-what')).toBe(true);
  });
});
