import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { NestJsEnvironmentAdapter } from '../../src/nestjs';
import {
  makeConfigServiceStub,
  type ConfigServiceStub,
} from '../mocks/config-service.stub';

type Environment = { PORT: number; NAME: string };

type SutTypes = {
  sut: NestJsEnvironmentAdapter<Environment>;
  configServiceStub: ConfigServiceStub;
};

const makeSut = (): SutTypes => {
  const configServiceStub = makeConfigServiceStub();
  const sut = new NestJsEnvironmentAdapter<Environment>(
    configServiceStub as unknown as ConfigService<Environment, true>,
  );

  return { sut, configServiceStub };
};

describe('NestJsEnvironmentAdapter', () => {
  describe('get', () => {
    it('should call configService.get with correct values', () => {
      const { sut, configServiceStub } = makeSut();

      sut.get({ env: 'NAME' });

      expect(configServiceStub.get).toHaveBeenCalledWith('NAME', {
        infer: true,
      });
    });

    it('should return the value from the config service', () => {
      const { sut, configServiceStub } = makeSut();
      configServiceStub.get.mockReturnValueOnce(4000);

      const port = sut.get({ env: 'PORT' });

      expect(port).toBe(4000);
    });
  });
});
