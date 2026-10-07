import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const ZERO_SHA = /^0+$/;
const CHANGESET_FILE = /^\.changeset\/[^/]+\.md$/;
const MAX_BUFFER = 64 * 1024 * 1024;

/** One line of what git passes a pre-push hook on stdin. */
export type PushRef = {
  localRef: string;
  localSha: string;
  remoteRef: string;
  remoteSha: string;
};

/**
 * Parses the pre-push hook's stdin, keeping branch updates only. Tags and
 * branch deletions don't carry new commits to describe.
 */
export function parsePushRefs(stdin: string): PushRef[] {
  return stdin
    .split('\n')
    .map(line => line.trim().split(/\s+/))
    .flatMap(([localRef, localSha, remoteRef, remoteSha]) =>
      localRef && localSha && remoteRef && remoteSha
        ? [{ localRef, localSha, remoteRef, remoteSha }]
        : [],
    )
    .filter(
      ref =>
        ref.localRef.startsWith('refs/heads/') && !ZERO_SHA.test(ref.localSha),
    );
}

export type PushResult = { ok: boolean; output: string };

/** The captured stdout or stderr of a failed child process, if any. */
function readStream(error: unknown, stream: 'stdout' | 'stderr'): string {
  if (typeof error !== 'object' || error === null || !(stream in error))
    return '';
  const value: unknown = Reflect.get(error, stream);
  return typeof value === 'string' ? value : '';
}

/** The git operations the changeset step needs. */
export class Git {
  private readonly cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  /** The checked-out branch, or '' on a detached HEAD. */
  async currentBranch(): Promise<string> {
    return (
      (await this.tryGit(['symbolic-ref', '--quiet', '--short', 'HEAD'])) ?? ''
    );
  }

  /** `origin/main` when it exists, otherwise `main`, otherwise undefined. */
  async resolveBaseRef(): Promise<string | undefined> {
    for (const ref of ['origin/main', 'main']) {
      if (
        (await this.tryGit(['rev-parse', '--verify', '--quiet', ref])) !==
        undefined
      ) {
        return ref;
      }
    }
    return undefined;
  }

  /** The commit where the branch left `baseRef`. */
  async mergeBase(baseRef: string): Promise<string> {
    return this.git(['merge-base', baseRef, 'HEAD']);
  }

  /** Changeset files the branch added or changed since `base`. */
  async changesetFilesSince(base: string): Promise<string[]> {
    const output = await this.git([
      'diff',
      '--name-only',
      '--diff-filter=d',
      base,
      'HEAD',
      '--',
      '.changeset',
    ]);
    return output
      .split('\n')
      .filter(
        file => CHANGESET_FILE.test(file) && !file.endsWith('/README.md'),
      );
  }

  /** Subjects of the commits since `base`, oldest first. */
  async commitSubjects(base: string): Promise<string[]> {
    const output = await this.git([
      'log',
      '--reverse',
      '--format=%s',
      `${base}..HEAD`,
    ]);
    return output.split('\n').filter(Boolean);
  }

  /** The diff since `base` for `paths`, without changelogs and build output. */
  async diff(base: string, paths: readonly string[]): Promise<string> {
    return this.git([
      'diff',
      base,
      'HEAD',
      '--',
      ...paths,
      ':(exclude,glob)**/CHANGELOG.md',
      ':(exclude,glob)**/dist/**',
    ]);
  }

  /** Commits only `file`, leaving anything else staged untouched. */
  async commitFile(file: string, message: string): Promise<void> {
    await this.git(['add', '--', file]);
    await this.git(['commit', '--message', message, '--only', '--', file]);
  }

  async hasUpstream(): Promise<boolean> {
    return (
      (await this.tryGit([
        'rev-parse',
        '--abbrev-ref',
        '--symbolic-full-name',
        '@{u}',
      ])) !== undefined
    );
  }

  /**
   * Pushes `refs` to `remote` with the given extra environment. Never passes
   * --no-verify: the pre-push hook runs again.
   */
  async push(
    remote: string,
    refs: readonly PushRef[],
    options: { setUpstream: boolean; env: Record<string, string> },
  ): Promise<PushResult> {
    const args = [
      'push',
      ...(options.setUpstream ? ['--set-upstream'] : []),
      remote,
      ...refs.map(ref => `${ref.localRef}:${ref.remoteRef}`),
    ];

    try {
      const { stdout, stderr } = await run('git', args, {
        cwd: this.cwd,
        env: { ...process.env, ...options.env },
        maxBuffer: MAX_BUFFER,
      });
      return { ok: true, output: `${stdout}${stderr}` };
    } catch (error) {
      return {
        ok: false,
        output: `${readStream(error, 'stdout')}${readStream(error, 'stderr')}`,
      };
    }
  }

  private async git(args: readonly string[]): Promise<string> {
    const { stdout } = await run('git', args, {
      cwd: this.cwd,
      maxBuffer: MAX_BUFFER,
    });
    return stdout.trim();
  }

  private async tryGit(args: readonly string[]): Promise<string | undefined> {
    try {
      return await this.git(args);
    } catch {
      return undefined;
    }
  }
}
