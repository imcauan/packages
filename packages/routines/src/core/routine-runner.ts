import { ConsoleLogger, type ILogger } from './logger.interface';
import type { IRoutineHandler } from './routine.interface';

/**
 * Wraps an `IRoutineHandler.execute()` for safe use as a cron callback:
 * - skips the tick if the previous run is still in flight (overlap guard);
 * - never lets a rejection escape (would otherwise crash the process /
 *   silently stop future ticks depending on the scheduler).
 */
export class RoutineRunner {
  private readonly logger: ILogger;
  private running = false;

  constructor(
    private readonly name: string,
    private readonly handler: IRoutineHandler,
    logger?: ILogger,
  ) {
    this.logger = logger ?? new ConsoleLogger(`Routine:${name}`);
  }

  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous run still in progress, skipping this tick');
      return;
    }

    this.running = true;

    try {
      await this.handler.execute();
    } catch (error) {
      if (this.handler.onError) {
        this.handler.onError(error);
      } else {
        this.logger.error(
          'Routine execution failed',
          error instanceof Error ? error.stack : error,
        );
      }
    } finally {
      this.running = false;
    }
  }
}
