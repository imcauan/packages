import { writeChangeset } from '@changesets/write';

import type { DraftChangeset } from './generator/changeset-generator.port.ts';

/** The file Changesets would write for `draft`. */
export function renderChangeset(draft: DraftChangeset): string {
  const frontMatter = draft.releases.map(
    release => `"${release.name}": ${release.bump}`,
  );
  return ['---', ...frontMatter, '---', '', draft.summary, ''].join('\n');
}

/**
 * Writes `draft` to `.changeset/<random-name>.md` with Changesets' own writer
 * (which also formats it), and returns the path relative to the root.
 */
export async function writeDraft(
  rootDir: string,
  draft: DraftChangeset,
): Promise<string> {
  const id = await writeChangeset(
    {
      summary: draft.summary,
      releases: draft.releases.map(release => ({
        name: release.name,
        type: release.bump,
      })),
    },
    rootDir,
  );
  return `.changeset/${id}.md`;
}
