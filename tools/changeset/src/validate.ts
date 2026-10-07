import {
  BUMPS,
  type Bump,
  type DraftChangeset,
  type DraftRelease,
} from './generator/changeset-generator.port.ts';

export type DraftValidation =
  | { valid: true; draft: DraftChangeset }
  | { valid: false; problems: string[] };

export type KnownPackages = {
  /** Every package in the workspace, published or not. */
  workspace: ReadonlySet<string>;
  /** The packages that are published. */
  published: ReadonlySet<string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBump = (value: unknown): value is Bump =>
  BUMPS.some(bump => bump === value);

/** Checks the model's answer before anything is written. */
export function validateDraft(
  candidate: unknown,
  packages: KnownPackages,
): DraftValidation {
  if (!isRecord(candidate)) {
    return { valid: false, problems: ['the answer is not a JSON object'] };
  }

  const problems: string[] = [];
  const releases: DraftRelease[] = [];
  const seen = new Set<string>();
  const rawReleases = candidate.releases;

  if (!Array.isArray(rawReleases) || rawReleases.length === 0) {
    problems.push('it lists no packages');
  } else {
    for (const release of rawReleases) {
      if (!isRecord(release) || typeof release.name !== 'string') {
        problems.push('a release has no package name');
        continue;
      }

      const { name, bump } = release;

      if (!packages.workspace.has(name)) {
        problems.push(`"${name}" is not a package in this workspace`);
      } else if (!packages.published.has(name)) {
        problems.push(`"${name}" is private and never published`);
      } else if (seen.has(name)) {
        problems.push(`"${name}" is listed twice`);
      } else if (!isBump(bump)) {
        problems.push(
          `"${name}" has bump "${String(bump)}"; expected patch, minor or major`,
        );
      } else {
        releases.push({ name, bump });
      }

      seen.add(name);
    }
  }

  const summary =
    typeof candidate.summary === 'string' ? candidate.summary.trim() : '';

  if (!summary) {
    problems.push('the summary is empty');
  }

  if (problems.length > 0) {
    return { valid: false, problems };
  }

  return { valid: true, draft: { releases, summary } };
}
