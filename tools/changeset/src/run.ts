import { ChangesetStepError, InvalidModelResponseError } from './errors.ts';
import type {
  ChangesetGenerator,
  DraftChangeset,
  GenerateChangesetInput,
} from './generator/changeset-generator.port.ts';
import {
  resolveProviderConfig,
  type ProviderConfig,
  type ProviderDefinition,
} from './generator/providers.ts';
import type { Git, PushRef } from './git.ts';
import { scriptFromBanner } from './hook-progress.ts';
import { renderChangesetBox } from './ui/changeset-box.ts';
import type { Reporter } from './ui/reporter.ts';
import type { Theme } from './ui/theme.ts';
import { validateDraft, type KnownPackages } from './validate.ts';
import type { Workspace } from './workspace.ts';

/** Diffs bigger than this are cut, to stay within the model's context. */
export const MAX_DIFF_CHARACTERS = 120_000;

const RELEASE_BRANCH_PREFIX = 'changeset-release/';

export type RunOptions = {
  /** Provider id from `--model`. */
  model?: string;
  /** Accept a major bump without asking (`--yes`). */
  yes: boolean;
  /** Print the changeset without writing or committing it. */
  dryRun: boolean;
  /** Show stack traces for unexpected errors. */
  debug: boolean;
  /** The remote being pushed to, when run from the pre-push hook. */
  remote?: string;
  /** The branch updates being pushed, from the hook's stdin. */
  pushRefs: readonly PushRef[];
};

/** Interactive questions; absent when there's no terminal. */
export type Prompts = {
  selectProvider(
    providers: readonly ProviderDefinition[],
  ): Promise<ProviderDefinition>;
  confirmMajor(packages: readonly string[]): Promise<boolean>;
};

export type RunDependencies = {
  git: Pick<
    Git,
    | 'currentBranch'
    | 'resolveBaseRef'
    | 'mergeBase'
    | 'changesetFilesSince'
    | 'commitSubjects'
    | 'diff'
    | 'commitFile'
    | 'hasUpstream'
    | 'push'
  >;
  workspace: Pick<Workspace, 'packages' | 'changedPublishedPackages'>;
  reporter: Reporter;
  theme: Theme;
  prompts?: Prompts;
  providers: readonly ProviderDefinition[];
  createGenerator(config: ProviderConfig): ChangesetGenerator;
  writeDraft(draft: DraftChangeset): Promise<string>;
  renderChangeset(draft: DraftChangeset): string;
  env: Readonly<Record<string, string | undefined>>;
};

type Exit = 0 | 1;

/** Why the step has nothing to do, or the merge base to compare with. */
async function findSkipReason(
  deps: RunDependencies,
  options: RunOptions,
): Promise<{ reason: string } | { base: string }> {
  if (deps.env.SKIP_CHANGESET === '1') {
    return { reason: 'SKIP_CHANGESET=1 is set' };
  }

  const branch = await deps.git.currentBranch();
  if (branch.startsWith(RELEASE_BRANCH_PREFIX)) {
    return { reason: `${branch} is the release branch` };
  }

  if (options.remote !== undefined && options.pushRefs.length === 0) {
    return { reason: 'this push updates no branch' };
  }

  const baseRef = await deps.git.resolveBaseRef();
  if (!baseRef) {
    return { reason: 'there is no main branch to compare with' };
  }

  const base = await deps.git.mergeBase(baseRef);
  const [existing] = await deps.git.changesetFilesSince(base);
  if (existing) {
    return { reason: `the branch already has a changeset · ${existing}` };
  }

  return { base };
}

async function chooseProvider(deps: RunDependencies, options: RunOptions) {
  if (options.model !== undefined) {
    const provider = deps.providers.find(
      candidate => candidate.id === options.model,
    );
    if (!provider) {
      throw new ChangesetStepError({
        what: `Unknown model "${options.model}"`,
        why: `--model accepts: ${deps.providers.map(candidate => candidate.id).join(', ')}.`,
      });
    }
    return { provider, how: 'from --model' };
  }

  const [first] = deps.providers;
  if (!first) {
    throw new ChangesetStepError({
      what: 'No model provider',
      why: 'None is configured.',
    });
  }
  if (deps.providers.length === 1) {
    return { provider: first, how: 'only provider' };
  }
  if (!deps.prompts) {
    return { provider: first, how: 'default, no terminal' };
  }
  return {
    provider: await deps.prompts.selectProvider(deps.providers),
    how: 'chosen',
  };
}

async function draftWithOneRetry(
  deps: RunDependencies,
  generator: ChangesetGenerator,
  input: GenerateChangesetInput,
  known: KnownPackages,
  label: string,
): Promise<DraftChangeset> {
  let problems: readonly string[] = [];

  for (const attempt of [1, 2]) {
    if (attempt === 2) {
      deps.reporter.warn(
        `The model's answer was unusable · retrying once (${problems.join('; ')})`,
      );
    }

    try {
      const candidate = await deps.reporter.task(label, () =>
        generator.generate(input),
      );
      const validation = validateDraft(candidate, known);
      if (validation.valid) {
        return validation.draft;
      }
      problems = validation.problems;
    } catch (error) {
      if (!(error instanceof InvalidModelResponseError)) {
        throw error;
      }
      problems = error.problems;
    }
  }

  throw new ChangesetStepError({
    what: 'The model returned an invalid changeset twice',
    why: `${problems.join('; ')}.`,
  });
}

async function confirmMajorBumps(
  deps: RunDependencies,
  options: RunOptions,
  draft: DraftChangeset,
) {
  const majors = draft.releases
    .filter(release => release.bump === 'major')
    .map(release => release.name);
  if (majors.length === 0 || options.yes) {
    return;
  }

  if (!deps.prompts) {
    throw new ChangesetStepError({
      what: 'A major bump needs confirmation',
      why: `The draft bumps ${majors.join(', ')} to a major version, and there's no terminal to confirm it.`,
    });
  }

  if (!(await deps.prompts.confirmMajor(majors))) {
    throw new ChangesetStepError({
      what: 'Major bump declined',
      why: `You declined the major bump for ${majors.join(', ')}.`,
    });
  }
}

/**
 * The pre-push changeset step: when the branch changes a published package
 * without a changeset, drafts one with a model, commits it, and pushes again.
 * Returns the exit code for the hook.
 */
export async function run(
  deps: RunDependencies,
  options: RunOptions,
): Promise<Exit> {
  const { reporter, git } = deps;

  try {
    const skip = await findSkipReason(deps, options);
    if ('reason' in skip) {
      reporter.skip(skip.reason);
      return 0;
    }

    const changed = await deps.workspace.changedPublishedPackages(skip.base);
    if (changed.length === 0) {
      reporter.skip('no published package changed');
      return 0;
    }

    reporter.header();
    reporter.step('Changes found', {
      detail: changed.map(pkg => pkg.name).join(', '),
    });

    const { provider, how } = await chooseProvider(deps, options);
    const config = resolveProviderConfig(provider, deps.env);
    reporter.step(`Model · ${provider.label}`, {
      detail: `${config.model} · ${how}`,
    });

    const [commits, fullDiff, workspacePackages] = await Promise.all([
      git.commitSubjects(skip.base),
      git.diff(
        skip.base,
        changed.map(pkg => pkg.dir),
      ),
      deps.workspace.packages(),
    ]);
    const diff =
      fullDiff.length > MAX_DIFF_CHARACTERS
        ? `${fullDiff.slice(0, MAX_DIFF_CHARACTERS)}\n[diff cut at ${MAX_DIFF_CHARACTERS} characters]`
        : fullDiff;

    const draft = await draftWithOneRetry(
      deps,
      deps.createGenerator(config),
      { changedPackages: changed.map(pkg => pkg.name), commits, diff },
      {
        workspace: new Set(workspacePackages.map(pkg => pkg.name)),
        published: new Set(
          workspacePackages.filter(pkg => pkg.published).map(pkg => pkg.name),
        ),
      },
      'Drafting changeset',
    );

    await confirmMajorBumps(deps, options, draft);
    reporter.block(renderChangesetBox(draft, deps.theme, reporter.width - 3));

    if (options.dryRun) {
      reporter.block(deps.renderChangeset(draft).trimEnd().split('\n'));
      reporter.end('Dry run · nothing written or committed.');
      return 0;
    }

    const file = await deps.writeDraft(draft);
    await git.commitFile(file, 'chore: add changeset');
    reporter.step(`Committed ${file}`);

    if (options.remote === undefined || options.pushRefs.length === 0) {
      reporter.end('Push when ready.');
      return 0;
    }

    const setUpstream = !(await git.hasUpstream());
    const remote = options.remote;
    const pushed = await reporter.task(
      'Pushing again with SKIP_CHANGESET=1',
      progress =>
        git.push(remote, options.pushRefs, {
          setUpstream,
          env: { SKIP_CHANGESET: '1' },
          // The hook runs one script per check; show which one is running.
          onLine: line => {
            const script = scriptFromBanner(line);
            if (script) progress(`running ${script}`);
          },
        }),
      () => ({ detail: 'all checks run once more' }),
    );

    if (!pushed.ok) {
      reporter.block(pushed.output.trimEnd().split('\n'));
      throw new ChangesetStepError({
        what: 'The second push failed',
        why: 'See its output above. The changeset is committed; fix the cause and push again.',
        next: [
          {
            command: 'git push',
            description: 'push again once the checks pass',
          },
        ],
      });
    }

    // Exit non-zero so git doesn't push the original refs a second time.
    reporter.end(
      "Pushed. Git reports this push as failed because the second push replaced it; that's expected.",
    );
    return 1;
  } catch (error) {
    if (error instanceof ChangesetStepError) {
      reporter.error({
        what: error.what,
        why: error.why,
        next: error.next,
        stack: options.debug ? error.stack : undefined,
      });
      return 1;
    }

    reporter.error({
      what: 'Unexpected error',
      why: error instanceof Error ? error.message : String(error),
      next: [
        {
          command: 'pnpm --filter @tools/changeset start --dry-run --debug',
          description: 'see the stack trace',
        },
        {
          command: 'SKIP_CHANGESET=1 git push',
          description: 'push without a changeset',
        },
      ],
      stack: options.debug && error instanceof Error ? error.stack : undefined,
    });
    return 1;
  }
}
