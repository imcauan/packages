import type { Mocked } from 'vitest';

import type { RunDependencies } from '../../src/run.ts';

export type GitStub = Mocked<RunDependencies['git']>;

export const makeGitStub = (): GitStub => ({
  currentBranch: vi.fn().mockResolvedValue('feat/any-branch'),
  resolveBaseRef: vi.fn().mockResolvedValue('origin/main'),
  mergeBase: vi.fn().mockResolvedValue('any-base-sha'),
  changesetFilesSince: vi.fn().mockResolvedValue([]),
  commitSubjects: vi.fn().mockResolvedValue(['feat(logger): any change']),
  diff: vi.fn().mockResolvedValue('any-diff'),
  commitFile: vi.fn().mockResolvedValue(undefined),
  hasUpstream: vi.fn().mockResolvedValue(true),
  push: vi.fn().mockResolvedValue({ ok: true, output: 'any-output' }),
});
