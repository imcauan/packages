import type { Mocked } from 'vitest';

import type { IRoutineHandler } from '../../src';

export const makeRoutineHandlerStub = (): Mocked<IRoutineHandler> => ({
  execute: vi.fn().mockResolvedValue(undefined),
});
