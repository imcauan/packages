import type {
  Bump,
  DraftChangeset,
} from '../generator/changeset-generator.port.ts';
import { alignRight, padEnd, wrap } from './text.ts';
import type { Theme } from './theme.ts';

const paintBump = (bump: Bump, theme: Theme): string => {
  if (bump === 'major') return theme.danger(bump);
  if (bump === 'minor') return theme.warning(bump);
  return theme.dim(bump);
};

/**
 * The drafted changeset in one bordered box: a row per package with its bump
 * flush right, a divider, then the summary.
 */
export function renderChangesetBox(
  draft: DraftChangeset,
  theme: Theme,
  width: number,
): string[] {
  const inner = width - 4;
  const border = (text: string) => theme.dim(text);
  const row = (content: string) =>
    `${border('│')} ${padEnd(content, inner)} ${border('│')}`;

  return [
    border(`╭${'─'.repeat(width - 2)}╮`),
    ...draft.releases.map(release =>
      row(alignRight(release.name, paintBump(release.bump, theme), inner)),
    ),
    border(`├${'─'.repeat(width - 2)}┤`),
    ...wrap(draft.summary, inner).map(line => row(line)),
    border(`╰${'─'.repeat(width - 2)}╯`),
  ];
}
