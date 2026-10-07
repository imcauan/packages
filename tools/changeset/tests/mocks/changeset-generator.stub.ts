import { vi, type Mocked } from 'vitest';

import type { ChangesetGenerator } from '../../src/generator/changeset-generator.port.ts';

export const makeChangesetGeneratorStub = (): Mocked<ChangesetGenerator> => ({
  generate: vi.fn().mockResolvedValue({
    releases: [{ name: '@imcauan/logger', bump: 'minor' }],
    summary: 'Add any feature.',
  }),
});
