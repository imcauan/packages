import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * A pnpm workspace in a temporary git repository, with a bare `origin`.
 * `main` holds a published package and a private one, and is pushed.
 */
export class TempRepository {
  readonly root: string;
  readonly dir: string;
  readonly remote: string;

  private constructor(root: string) {
    this.root = root;
    this.dir = path.join(root, 'work');
    this.remote = path.join(root, 'origin.git');
  }

  static async create(): Promise<TempRepository> {
    const repository = new TempRepository(
      await mkdtemp(path.join(tmpdir(), 'changeset-cli-')),
    );
    await repository.init();
    return repository;
  }

  async git(...args: string[]): Promise<string> {
    const { stdout } = await run('git', args, { cwd: this.dir });
    return stdout.trim();
  }

  async write(file: string, content: string): Promise<void> {
    const target = path.join(this.dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }

  async commit(message: string, ...files: string[]): Promise<void> {
    await this.git('add', ...files);
    await this.git('commit', '--message', message);
  }

  /** Installs a pre-push hook that records SKIP_CHANGESET in `hook-ran`. */
  async installRecordingPrePushHook(): Promise<void> {
    const hook = path.join(this.dir, '.git', 'hooks', 'pre-push');
    await writeFile(
      hook,
      '#!/bin/sh\necho "SKIP_CHANGESET=$SKIP_CHANGESET" > "$(git rev-parse --git-dir)/hook-ran"\n',
    );
    await chmod(hook, 0o755);
  }

  async remove(): Promise<void> {
    await rm(this.root, { recursive: true, force: true });
  }

  private async init(): Promise<void> {
    await run('git', ['init', '--bare', '--initial-branch=main', this.remote]);
    await mkdir(this.dir);
    await this.git('init', '--initial-branch=main');
    await this.git('config', 'user.name', 'any-name');
    await this.git('config', 'user.email', 'any@email.com');
    await this.git('config', 'commit.gpgsign', 'false');
    await this.git('remote', 'add', 'origin', this.remote);

    await this.write(
      'package.json',
      JSON.stringify({ name: 'any-root', private: true }),
    );
    await this.write('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n");
    await this.write(
      'packages/published/package.json',
      JSON.stringify({ name: '@any/published', version: '0.1.0' }),
    );
    await this.write(
      'packages/published/src/index.ts',
      'export const value = 1;\n',
    );
    await this.write(
      'packages/private/package.json',
      JSON.stringify({ name: '@any/private', version: '0.0.0', private: true }),
    );
    await this.write(
      'packages/private/src/index.ts',
      'export const value = 1;\n',
    );
    await this.commit('chore: initial commit', '.');
    await this.git('push', '--quiet', 'origin', 'main');
    await this.git('switch', '--quiet', '--create', 'feat/any-branch');
  }
}
