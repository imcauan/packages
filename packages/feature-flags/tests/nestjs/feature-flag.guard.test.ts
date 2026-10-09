import 'reflect-metadata';

import { NotFoundException, type Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test, type TestingModule } from '@nestjs/testing';

import { FeatureFlagProvider, NoopFeatureFlagProvider } from '../../src';
import { FeatureFlagGuard, RequireFeatureFlag } from '../../src/nestjs';

class OpenController {
  open(): void {}
}

@RequireFeatureFlag('any-flag')
class GatedController {
  gated(): void {}
}

class MixedController {
  @RequireFeatureFlag('any-flag')
  gated(): void {}

  open(): void {}
}

const contextFor = (controller: Type, method: string) =>
  new ExecutionContextHost(
    [],
    controller,
    (controller.prototype as Record<string, () => void>)[method],
  );

describe('FeatureFlagGuard (NestJS)', () => {
  let moduleRef: TestingModule;
  let guard: FeatureFlagGuard;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        { provide: FeatureFlagProvider, useClass: NoopFeatureFlagProvider },
        {
          provide: FeatureFlagGuard,
          inject: [FeatureFlagProvider, Reflector],
          useFactory: (
            provider: NoopFeatureFlagProvider,
            reflector: Reflector,
          ) => new FeatureFlagGuard(provider, reflector),
        },
      ],
    }).compile();
    guard = moduleRef.get(FeatureFlagGuard);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('should let a route without a flag through', async () => {
    const result = await guard.canActivate(contextFor(OpenController, 'open'));

    expect(result).toBe(true);
  });

  it('should reject a route on a gated controller', async () => {
    const promise = guard.canActivate(contextFor(GatedController, 'gated'));

    await expect(promise).rejects.toThrow(NotFoundException);
  });

  it('should reject a gated method', async () => {
    const promise = guard.canActivate(contextFor(MixedController, 'gated'));

    await expect(promise).rejects.toThrow(NotFoundException);
  });

  it('should let an ungated method of the same controller through', async () => {
    const result = await guard.canActivate(contextFor(MixedController, 'open'));

    expect(result).toBe(true);
  });
});
