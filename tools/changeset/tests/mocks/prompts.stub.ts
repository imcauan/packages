import type { Mocked } from 'vitest';

import type { Prompts } from '../../src/run.ts';

export const makePromptsStub = (): Mocked<Prompts> => ({
  selectProvider: vi.fn(async providers => {
    const [first] = providers;
    if (!first) throw new Error('no providers');
    return first;
  }),
  confirmMajor: vi.fn().mockResolvedValue(true),
});
