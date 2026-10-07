import 'reflect-metadata';

import { v } from '@imcauan/validation';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { IEnvironment } from '../../src';
import { Environment, EnvironmentGatewayModule } from '../../src/nestjs';

type AppEnvironment = { APP_PORT: number; APP_NAME: string };

const register = () =>
  EnvironmentGatewayModule.register<AppEnvironment>({
    ignoreEnvFile: true,
    schemas: [
      v.object({ APP_PORT: v.env.port(3000) }),
      v.object({ APP_NAME: v.string({ requiredError: 'any-required' }) }),
    ],
  });

describe('EnvironmentGatewayModule (NestJS)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should provide the validated environment under the Environment token', async () => {
    vi.stubEnv('APP_NAME', 'any-name');
    vi.stubEnv('APP_PORT', '4000');
    const moduleRef = await Test.createTestingModule({
      imports: [register()],
    }).compile();

    const environment =
      moduleRef.get<IEnvironment<AppEnvironment>>(Environment);
    const port = environment.get({ env: 'APP_PORT' });

    expect(port).toBe(4000);
    await moduleRef.close();
  });

  it('should fail to compile when the environment is invalid', async () => {
    vi.stubEnv('APP_NAME', '');

    const promise = Test.createTestingModule({
      imports: [register()],
    }).compile();

    await expect(promise).rejects.toThrow('any-required');
  });
});
