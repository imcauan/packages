/** Minimal logger contract `RoutineRunner` needs. Nest's `Logger` satisfies this as-is. */
export interface ILogger {
  warn(message: string): void;
  error(message: string, trace?: unknown): void;
}

export class ConsoleLogger implements ILogger {
  constructor(private readonly context: string) {}

  warn(message: string): void {
    console.warn(`[${this.context}] ${message}`);
  }

  error(message: string, trace?: unknown): void {
    console.error(`[${this.context}] ${message}`, trace ?? '');
  }
}
