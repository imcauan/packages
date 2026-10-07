import { describe, expect, it } from 'vitest';

import { renderChangesetBox } from '../../src/ui/changeset-box.ts';
import { createTheme } from '../../src/ui/theme.ts';

const makeSut = (): typeof renderChangesetBox => renderChangesetBox;

describe('renderChangesetBox', () => {
  it('should draw one row per package, a divider and the summary', () => {
    const sut = makeSut();

    const lines = sut(
      {
        releases: [
          { name: '@imcauan/logger', bump: 'minor' },
          { name: '@imcauan/environment', bump: 'patch' },
        ],
        summary: 'Add any feature to the logger and the environment.',
      },
      createTheme({ color: false }),
      34,
    );

    expect(lines).toEqual([
      '╭────────────────────────────────╮',
      '│ @imcauan/logger          minor │',
      '│ @imcauan/environment     patch │',
      '├────────────────────────────────┤',
      '│ Add any feature to the logger  │',
      '│ and the environment.           │',
      '╰────────────────────────────────╯',
    ]);
  });

  it('should paint a major bump in red and bold', () => {
    const sut = makeSut();

    const lines = sut(
      {
        releases: [{ name: '@imcauan/logger', bump: 'major' }],
        summary: 'any-summary',
      },
      createTheme({ color: true }),
      34,
    );

    expect(lines[1]).toContain('\x1b[1m\x1b[38;2;244;112;103mmajor');
  });
});
