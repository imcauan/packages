import type { ConfigService } from '@nestjs/config';
import { vi, type Mocked } from 'vitest';

export type ConfigServiceStub = Mocked<Pick<ConfigService, 'get'>>;

export const makeConfigServiceStub = (): ConfigServiceStub => ({
  get: vi.fn().mockReturnValue('any-value'),
});
