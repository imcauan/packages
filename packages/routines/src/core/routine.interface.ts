export type Constructor<T> = new (...args: never[]) => T;

/**
 * Implement this on a class to hold a routine's logic. Keep it free of
 * scheduling concerns (name, cron) — those live on the `IRoutineDefinition`
 * that references it.
 */
export interface IRoutineHandler {
  /** Runs on each tick. Rejections are caught and logged, never thrown. */
  execute(): Promise<void>;
  /**
   * Called when `execute()` throws or rejects. Defaults to logging via
   * `ILogger`. Override to add routine-specific error handling (alerting, etc).
   */
  onError?(error: unknown): void;
}

/**
 * Declares a routine: when it runs (`cron`) and what runs (`handler`).
 */
export interface IRoutineDefinition {
  /** Unique name, used as the cron job key and in logs. */
  name: string;
  /** Cron expression string. */
  cron: string;
  handler: Constructor<IRoutineHandler>;
}
