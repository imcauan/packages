import {
  Logger,
  Module,
  type DynamicModule,
  type OnModuleInit,
  type Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { RoutineRunner } from '../core/routine-runner';
import type {
  IRoutineDefinition,
  IRoutineHandler,
} from '../core/routine.interface';

/** `IRoutineDefinition` with a `handler` that Nest can resolve. */
export type NestRoutineDefinition = Omit<IRoutineDefinition, 'handler'> & {
  handler: Type<IRoutineHandler>;
};

const ROUTINE_DEFINITIONS = Symbol('ROUTINE_DEFINITIONS');

/**
 * Starts one cron job per definition once the app's modules are initialized.
 * Built by a factory, so no constructor parameter metadata is needed.
 */
class RoutineScheduler implements OnModuleInit {
  constructor(
    private readonly definitions: NestRoutineDefinition[],
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit(): void {
    for (const definition of this.definitions) {
      const handler = this.moduleRef.get(definition.handler, {
        strict: false,
      });
      const logger = new Logger(`Routine:${definition.name}`);
      const runner = new RoutineRunner(definition.name, handler, logger);
      const job = new CronJob(definition.cron, () => void runner.run());

      this.schedulerRegistry.addCronJob(definition.name, job);
      job.start();
    }
  }
}

@Module({})
class RoutinesFeatureModule {}

@Module({})
export class RoutinesModule {
  /** Enables `@nestjs/schedule`. Import it once, in the root module. */
  static forRoot(): DynamicModule {
    return {
      module: RoutinesModule,
      imports: [ScheduleModule.forRoot()],
    };
  }

  /**
   * Registers routines. Each `handler` class must be a provider somewhere in
   * the app (`@Injectable()`, or a factory provider keyed by the class): it's
   * resolved from the whole app's container, not from this module.
   */
  static forFeature(definitions: NestRoutineDefinition[]): DynamicModule {
    return {
      module: RoutinesFeatureModule,
      providers: [
        { provide: ROUTINE_DEFINITIONS, useValue: definitions },
        {
          provide: RoutineScheduler,
          inject: [ROUTINE_DEFINITIONS, SchedulerRegistry, ModuleRef],
          useFactory: (
            routineDefinitions: NestRoutineDefinition[],
            schedulerRegistry: SchedulerRegistry,
            moduleRef: ModuleRef,
          ) =>
            new RoutineScheduler(
              routineDefinitions,
              schedulerRegistry,
              moduleRef,
            ),
        },
      ],
    };
  }
}
