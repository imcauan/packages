import 'reflect-metadata';

import type { DynamicModule, ValueProvider } from '@nestjs/common';
import { PARAMS_PROVIDER_TOKEN, type Params } from 'nestjs-pino';

import { traceMixin, type LoggerConfig } from '../../src';
import { LoggerModule } from '../../src/nestjs';

type PinoHttpOptions = {
  name: string;
  level: string;
  mixin: unknown;
  transport: {
    targets: { target: string; options?: Record<string, unknown> }[];
  };
};

/** Reads the options LoggerModule passed to nestjs-pino. */
const getPinoHttpOptions = (module: DynamicModule): PinoHttpOptions => {
  const provider = module.providers?.find(
    (candidate): candidate is ValueProvider<Params> =>
      typeof candidate === 'object' &&
      candidate.provide === PARAMS_PROVIDER_TOKEN,
  );
  return provider?.useValue.pinoHttp as PinoHttpOptions;
};

const makeConfig = (overrides: Partial<LoggerConfig> = {}): LoggerConfig => ({
  serviceName: 'any-service',
  env: 'development',
  ...overrides,
});

const makeSut = (): typeof LoggerModule => LoggerModule;

describe('LoggerModule', () => {
  describe('forRoot', () => {
    it('should name the logger after the service', () => {
      const sut = makeSut();

      const module = sut.forRoot(makeConfig());

      expect(getPinoHttpOptions(module).name).toBe('any-service');
    });

    it('should log at info level by default', () => {
      const sut = makeSut();

      const module = sut.forRoot(makeConfig());

      expect(getPinoHttpOptions(module).level).toBe('info');
    });

    it('should use the configured level', () => {
      const sut = makeSut();

      const module = sut.forRoot(makeConfig({ level: 'debug' }));

      expect(getPinoHttpOptions(module).level).toBe('debug');
    });

    it('should stamp log lines with the trace mixin', () => {
      const sut = makeSut();

      const module = sut.forRoot(makeConfig());

      expect(getPinoHttpOptions(module).mixin).toBe(traceMixin);
    });

    it('should pretty-print outside production', () => {
      const sut = makeSut();

      const module = sut.forRoot(makeConfig({ env: 'development' }));

      expect(getPinoHttpOptions(module).transport.targets).toEqual([
        {
          target: expect.stringMatching(/^file:.*pino-pretty/),
          options: { singleLine: true, colorize: true },
        },
      ]);
    });

    it('should write JSON to stdout in production', () => {
      const sut = makeSut();

      const module = sut.forRoot(makeConfig({ env: 'production' }));

      expect(getPinoHttpOptions(module).transport.targets).toEqual([
        { target: 'pino/file', options: { destination: 1 } },
      ]);
    });

    it('should let the pretty option override the environment default', () => {
      const sut = makeSut();

      const module = sut.forRoot(
        makeConfig({ env: 'production', pretty: true }),
      );

      expect(getPinoHttpOptions(module).transport.targets).toEqual([
        expect.objectContaining({
          target: expect.stringMatching(/pino-pretty/),
        }),
      ]);
    });

    it('should also ship logs to Loki when a Loki URL is set', () => {
      const sut = makeSut();

      const module = sut.forRoot(
        makeConfig({ env: 'production', lokiUrl: 'http://any.loki' }),
      );

      expect(getPinoHttpOptions(module).transport.targets[1]).toEqual({
        target: expect.stringMatching(/^file:.*pino-loki/),
        options: {
          host: 'http://any.loki',
          labels: { service: 'any-service', env: 'production' },
        },
      });
    });
  });
});
