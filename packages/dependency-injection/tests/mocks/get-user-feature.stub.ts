import type { Mocked } from 'vitest';

import type { GetUserFeature } from './user-feature.fixtures';

export const makeGetUserFeatureStub = (): Mocked<GetUserFeature> => ({
  execute: vi.fn().mockResolvedValue({ id: 'any-id', name: 'any-name' }),
});
