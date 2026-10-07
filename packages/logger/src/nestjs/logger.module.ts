import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import type { LoggerConfig } from '../logger-config.interface';
import { traceMixin } from '../trace-mixin';

type TransportTarget = {
  target: string;
  options?: Record<string, unknown>;
  level?: string;
};

/**
 * Resolves an optional transport from this package's location. pino would
 * otherwise resolve the name from the file that created the logger
 * (pino-http), which can't see this package's peers under strict layouts.
 */
function resolveTransport(name: 'pino-loki' | 'pino-pretty'): string {
  try {
    return import.meta.resolve(name);
  } catch {
    throw new Error(
      `@imcauan/logger: the "${name}" transport is enabled but not installed. Install it with \`pnpm add ${name}\`.`,
    );
  }
}

function buildTransportTargets(config: LoggerConfig): TransportTarget[] {
  const targets: TransportTarget[] = [];

  const pretty = config.pretty ?? config.env !== 'production';

  if (pretty) {
    targets.push({
      target: resolveTransport('pino-pretty'),
      options: { singleLine: true, colorize: true },
    });
  } else {
    targets.push({ target: 'pino/file', options: { destination: 1 } });
  }

  if (config.lokiUrl) {
    targets.push({
      target: resolveTransport('pino-loki'),
      options: {
        host: config.lokiUrl,
        labels: { service: config.serviceName, env: config.env },
      },
    });
  }

  return targets;
}

@Module({})
export class LoggerModule {
  /**
   * Configures `nestjs-pino` with JSON logging, a pretty-printed transport
   * for non-production environments, an optional Loki transport, and a
   * `mixin()` that stamps every log line with the active OpenTelemetry
   * trace and span ids, when there are any.
   */
  static forRoot(config: LoggerConfig): DynamicModule {
    return PinoLoggerModule.forRoot({
      pinoHttp: {
        name: config.serviceName,
        level: config.level ?? 'info',
        mixin: traceMixin,
        transport: {
          targets: buildTransportTargets(config),
        },
      },
    });
  }
}
