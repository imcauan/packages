import 'reflect-metadata';

import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Mocked } from 'vitest';

import type { IFeatureFlagProvider } from '../../src';
import { FeatureFlagGuard, REQUIRE_FEATURE_FLAG_KEY } from '../../src/nestjs';
import { makeFeatureFlagProviderStub } from '../mocks/feature-flag-provider.stub';

type SutTypes = {
  sut: FeatureFlagGuard;
  featureFlagProviderStub: Mocked<IFeatureFlagProvider>;
  reflector: Reflector;
  context: ExecutionContextHost;
};

const makeSut = (): SutTypes => {
  const featureFlagProviderStub = makeFeatureFlagProviderStub();
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('any-flag');
  const context = new ExecutionContextHost([], class {}, () => undefined);
  const sut = new FeatureFlagGuard(featureFlagProviderStub, reflector);

  return { sut, featureFlagProviderStub, reflector, context };
};

describe('FeatureFlagGuard', () => {
  describe('canActivate', () => {
    it('should call reflector.getAllAndOverride with correct values', async () => {
      const { sut, reflector, context } = makeSut();

      await sut.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        REQUIRE_FEATURE_FLAG_KEY,
        [context.getHandler(), context.getClass()],
      );
    });

    it('should return true when the route has no flag', async () => {
      const { sut, reflector, context } = makeSut();
      vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(undefined);

      const result = await sut.canActivate(context);

      expect(result).toBe(true);
    });

    it('should not call featureFlagProvider.isEnabled when the route has no flag', async () => {
      const { sut, reflector, featureFlagProviderStub, context } = makeSut();
      vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(undefined);

      await sut.canActivate(context);

      expect(featureFlagProviderStub.isEnabled).not.toHaveBeenCalled();
    });

    it('should call featureFlagProvider.isEnabled with correct values', async () => {
      const { sut, featureFlagProviderStub, context } = makeSut();

      await sut.canActivate(context);

      expect(featureFlagProviderStub.isEnabled).toHaveBeenCalledWith(
        'any-flag',
      );
    });

    it('should return true when the flag is on', async () => {
      const { sut, context } = makeSut();

      const result = await sut.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when the flag is off', async () => {
      const { sut, featureFlagProviderStub, context } = makeSut();
      featureFlagProviderStub.isEnabled.mockResolvedValueOnce(false);

      const promise = sut.canActivate(context);

      await expect(promise).rejects.toThrow(NotFoundException);
    });
  });
});
