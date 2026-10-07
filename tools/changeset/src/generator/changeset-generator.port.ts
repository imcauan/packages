export const BUMPS = ['patch', 'minor', 'major'] as const;

export type Bump = (typeof BUMPS)[number];

export type DraftRelease = { name: string; bump: Bump };

/** A validated changeset, ready to be written. */
export type DraftChangeset = {
  releases: DraftRelease[];
  summary: string;
};

export type GenerateChangesetInput = {
  /** Published packages this branch changed. */
  changedPackages: readonly string[];
  /** Subjects of the branch's commits, oldest first. */
  commits: readonly string[];
  /** The branch diff for the changed packages. */
  diff: string;
};

/**
 * Port for anything that drafts a changeset from a branch's changes. The
 * result is the model's raw answer: callers validate it before use.
 */
export interface ChangesetGenerator {
  generate(input: GenerateChangesetInput): Promise<unknown>;
}
