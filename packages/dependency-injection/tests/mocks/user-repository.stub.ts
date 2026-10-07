import { vi, type Mocked } from 'vitest';

import type { UserRepository } from './user-feature.fixtures';

export const makeUserRepositoryStub = (): Mocked<UserRepository> => ({
  findById: vi.fn().mockResolvedValue({ id: 'any-id', name: 'any-name' }),
});
