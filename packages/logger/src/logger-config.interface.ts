export type LoggerConfig = {
  /** Reported as the `service` label on every log line and in Loki. */
  serviceName: string;
  /** Controls pretty-printing: pretty everywhere except `'production'`. */
  env: string;
  /** When provided, logs are additionally shipped to Loki at this push URL. */
  lokiUrl?: string;
  /** Minimum pino level. Defaults to `'info'`. */
  level?: string;
  /**
   * Force pretty-printed (colorized, single-line) console output instead of
   * raw JSON. Defaults to `env !== 'production'`; set explicitly to override
   * that default in either direction (e.g. pretty logs in production, or
   * raw JSON locally).
   */
  pretty?: boolean;
};
