import { vi, type Mocked } from 'vitest';

import type { RunDependencies } from '../../src/run.ts';

export type WorkspaceStub = Mocked<RunDependencies['workspace']>;

export const makeWorkspaceStub = (): WorkspaceStub => ({
  packages: vi.fn().mockResolvedValue([
    { name: '@imcauan/logger', dir: 'packages/logger', published: true },
    {
      name: '@imcauan/validation',
      dir: 'packages/validation',
      published: true,
    },
    { name: '@tools/changeset', dir: 'tools/changeset', published: false },
  ]),
  changedPublishedPackages: vi
    .fn()
    .mockResolvedValue([
      { name: '@imcauan/logger', dir: 'packages/logger', published: true },
    ]),
});
