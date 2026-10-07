import 'reflect-metadata';

import { Test, type TestingModule } from '@nestjs/testing';
import { Logger as PinoLogger } from 'nestjs-pino';

import { Logger, LoggerModule } from '../../src/nestjs';

describe('LoggerModule (NestJS)', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          serviceName: 'any-service',
          env: 'production',
          lokiUrl: 'http://localhost:3100',
        }),
      ],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('should provide the nestjs-pino Logger', () => {
    const logger = moduleRef.get(Logger);

    expect(logger).toBeInstanceOf(PinoLogger);
  });
});
