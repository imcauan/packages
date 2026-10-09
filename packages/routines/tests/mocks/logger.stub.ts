import type { Mocked } from 'vitest';

import type { ILogger } from '../../src';

export const makeLoggerStub = (): Mocked<ILogger> => ({
  warn: vi.fn(),
  error: vi.fn(),
});
