import { initTracing } from './init-tracing';

/**
 * Starts tracing from the standard OpenTelemetry environment variables as soon
 * as it's imported. Import it first in the app's entry point:
 *
 * ```ts
 * import '@imcauan/tracing/register';
 * ```
 */
initTracing({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'unknown-service',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
});
