import type { Mocked } from 'vitest';

import type { Logger } from './user-feature.fixtures';

export const makeLoggerStub = (): Mocked<Logger> => ({
  log: vi.fn(),
});
