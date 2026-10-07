/** A way forward printed under an error: the command, and what it does. */
export type NextStep = { command: string; description: string };

/** The two ways forward whenever a changeset can't be drafted. */
const MANUAL_WAYS_FORWARD: readonly NextStep[] = [
  { command: 'pnpm changeset', description: 'write the changeset by hand' },
  {
    command: 'SKIP_CHANGESET=1 git push',
    description: 'push without one (CI still asks for it)',
  },
];

type ChangesetStepErrorParams = {
  /** What failed, in a few words. */
  what: string;
  /** Why it failed. */
  why: string;
  /** What to do next. Defaults to MANUAL_WAYS_FORWARD. */
  next?: readonly NextStep[];
  cause?: unknown;
};

/** An expected failure, reported as what failed, why, and what to do next. */
export class ChangesetStepError extends Error {
  readonly what: string;
  readonly why: string;
  readonly next: readonly NextStep[];

  constructor({
    what,
    why,
    next = MANUAL_WAYS_FORWARD,
    cause,
  }: ChangesetStepErrorParams) {
    super(`${what}: ${why}`, { cause });
    this.name = 'ChangesetStepError';
    this.what = what;
    this.why = why;
    this.next = next;
  }
}

/** The model answered, but not with a usable changeset. Worth one retry. */
export class InvalidModelResponseError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`Invalid model response: ${problems.join('; ')}`);
    this.name = 'InvalidModelResponseError';
    this.problems = problems;
  }
}
