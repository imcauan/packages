import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Git, type PushRef } from '../src/git.ts';
import { TempRepository } from './mocks/temp-repository.ts';

describe('Git (temporary repository)', () => {
  let repository: TempRepository;
  let sut: Git;

  beforeEach(async () => {
    repository = await TempRepository.create();
    sut = new Git(repository.dir);
  });

  afterEach(async () => {
    await repository.remove();
  });

  it('should return the current branch', async () => {
    const branch = await sut.currentBranch();

    expect(branch).toBe('feat/any-branch');
  });

  it('should return an empty branch on a detached HEAD', async () => {
    await repository.git('switch', '--quiet', '--detach');

    const branch = await sut.currentBranch();

    expect(branch).toBe('');
  });

  it('should compare with origin/main when it exists', async () => {
    const ref = await sut.resolveBaseRef();

    expect(ref).toBe('origin/main');
  });

  it('should fall back to main without a remote main', async () => {
    await repository.git('update-ref', '-d', 'refs/remotes/origin/main');

    const ref = await sut.resolveBaseRef();

    expect(ref).toBe('main');
  });

  it('should find changesets the branch added', async () => {
    await repository.write('.changeset/any-name.md', '---\n---\n');
    await repository.write('.changeset/README.md', 'any-text');
    await repository.commit('chore: add changeset', '.changeset');
    const base = await sut.mergeBase('origin/main');

    const files = await sut.changesetFilesSince(base);

    expect(files).toEqual(['.changeset/any-name.md']);
  });

  it('should list the branch commit subjects, oldest first', async () => {
    await repository.write('packages/published/src/a.ts', 'a');
    await repository.commit('feat: any first', '.');
    await repository.write('packages/published/src/b.ts', 'b');
    await repository.commit('fix: any second', '.');
    const base = await sut.mergeBase('origin/main');

    const subjects = await sut.commitSubjects(base);

    expect(subjects).toEqual(['feat: any first', 'fix: any second']);
  });

  it('should diff only the given paths', async () => {
    await repository.write(
      'packages/published/src/index.ts',
      'export const value = 2;\n',
    );
    await repository.write(
      'packages/private/src/index.ts',
      'export const value = 2;\n',
    );
    await repository.commit('feat: any change', '.');
    const base = await sut.mergeBase('origin/main');

    const diff = await sut.diff(base, ['packages/published']);

    expect([
      diff.includes('packages/published'),
      diff.includes('packages/private'),
    ]).toEqual([true, false]);
  });

  it('should leave changelogs out of the diff', async () => {
    await repository.write('packages/published/CHANGELOG.md', 'any-text');
    await repository.write(
      'packages/published/src/index.ts',
      'export const value = 2;\n',
    );
    await repository.commit('feat: any change', '.');
    const base = await sut.mergeBase('origin/main');

    const diff = await sut.diff(base, ['packages/published']);

    expect(diff).not.toContain('CHANGELOG.md');
  });

  it('should commit only the given file', async () => {
    await repository.write('.changeset/any-name.md', 'any-changeset');
    await repository.write('any-staged.txt', 'any-text');
    await repository.git('add', 'any-staged.txt');

    await sut.commitFile('.changeset/any-name.md', 'chore: add changeset');

    const committed = await repository.git(
      'show',
      '--name-only',
      '--format=%s',
      'HEAD',
    );
    expect(committed.split('\n')).toEqual([
      'chore: add changeset',
      '',
      '.changeset/any-name.md',
    ]);
  });

  it('should report a branch without an upstream', async () => {
    const hasUpstream = await sut.hasUpstream();

    expect(hasUpstream).toBe(false);
  });

  describe('push', () => {
    const branchRef = (sha: string): PushRef => ({
      localRef: 'refs/heads/feat/any-branch',
      localSha: sha,
      remoteRef: 'refs/heads/feat/any-branch',
      remoteSha: '0'.repeat(40),
    });

    it('should push the branch to the remote', async () => {
      const head = await repository.git('rev-parse', 'HEAD');

      await sut.push('origin', [branchRef(head)], {
        setUpstream: false,
        env: {},
      });

      const remoteHead = await repository.git(
        'ls-remote',
        'origin',
        'refs/heads/feat/any-branch',
      );
      expect(remoteHead.split('\t')[0]).toBe(head);
    });

    it('should set the upstream when asked', async () => {
      const head = await repository.git('rev-parse', 'HEAD');

      await sut.push('origin', [branchRef(head)], {
        setUpstream: true,
        env: {},
      });

      const hasUpstream = await sut.hasUpstream();
      expect(hasUpstream).toBe(true);
    });

    it('should run the pre-push hook with the given environment', async () => {
      await repository.installRecordingPrePushHook();
      const head = await repository.git('rev-parse', 'HEAD');

      await sut.push('origin', [branchRef(head)], {
        setUpstream: false,
        env: { SKIP_CHANGESET: '1' },
      });

      const recorded = await readFile(
        path.join(repository.dir, '.git', 'hook-ran'),
        'utf8',
      );
      expect(recorded.trim()).toBe('SKIP_CHANGESET=1');
    });

    it('should report a failed push with its output', async () => {
      const result = await sut.push(
        'any-missing-remote',
        [branchRef('a'.repeat(40))],
        {
          setUpstream: false,
          env: {},
        },
      );

      expect(result.ok).toBe(false);
    });
  });
});
