import type { Mocked } from 'vitest';

import type { IFeatureFlagProvider } from '../../src';

export const makeFeatureFlagProviderStub =
  (): Mocked<IFeatureFlagProvider> => ({
    isEnabled: vi.fn().mockResolvedValue(true),
  });
