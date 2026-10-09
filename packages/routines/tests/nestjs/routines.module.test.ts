import 'reflect-metadata';

import { Injectable, Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, type TestingModule } from '@nestjs/testing';

import type { IRoutineHandler } from '../../src';
import { RoutinesModule } from '../../src/nestjs';

@Injectable()
class InjectableHandler implements IRoutineHandler {
  readonly execute = vi.fn().mockResolvedValue(undefined);
}

class FactoryHandler implements IRoutineHandler {
  readonly execute = vi.fn().mockResolvedValue(undefined);
}

@Module({
  imports: [
    RoutinesModule.forFeature([
      { name: 'any-routine', cron: '* * * * *', handler: InjectableHandler },
    ]),
  ],
  providers: [InjectableHandler],
})
class InjectableFeatureModule {}

@Module({
  imports: [
    RoutinesModule.forFeature([
      {
        name: 'any-factory-routine',
        cron: '0 * * * *',
        handler: FactoryHandler,
      },
    ]),
  ],
  providers: [
    { provide: FactoryHandler, useFactory: () => new FactoryHandler() },
  ],
})
class FactoryFeatureModule {}

describe('RoutinesModule (NestJS)', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [
        RoutinesModule.forRoot(),
        InjectableFeatureModule,
        FactoryFeatureModule,
      ],
    }).compile();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should register a cron job under the routine name', () => {
    const job = app.get(SchedulerRegistry).getCronJob('any-routine');

    expect(job.cronTime.source).toBe('* * * * *');
  });

  it('should start the cron job', () => {
    const job = app.get(SchedulerRegistry).getCronJob('any-routine');

    expect(job.isActive).toBe(true);
  });

  it('should run the handler on each tick', async () => {
    const job = app.get(SchedulerRegistry).getCronJob('any-routine');

    await job.fireOnTick();

    expect(app.get(InjectableHandler).execute).toHaveBeenCalledOnce();
  });

  it('should resolve a handler provided by a factory', async () => {
    const job = app.get(SchedulerRegistry).getCronJob('any-factory-routine');

    await job.fireOnTick();

    expect(app.get(FactoryHandler).execute).toHaveBeenCalledOnce();
  });
});
