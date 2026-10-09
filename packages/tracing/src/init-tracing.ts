import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export type TracingConfig = {
  /** Reported as `service.name` on every span. */
  serviceName: string;
  /**
   * OTLP/HTTP traces endpoint, e.g. `http://localhost:4318/v1/traces`. Without
   * it, tracing is skipped and `initTracing` returns `undefined`, so an app
   * runs the same without a collector.
   */
  otlpEndpoint?: string;
};

/**
 * Starts the OpenTelemetry Node SDK with auto-instrumentation (HTTP, Express,
 * NestJS and more) and exports traces over OTLP/HTTP. On `SIGTERM` it flushes
 * pending spans and exits.
 *
 * Call it before the app imports anything else: auto-instrumentation patches
 * modules as they load, so modules imported earlier aren't traced.
 */
export function initTracing(config: TracingConfig): NodeSDK | undefined {
  if (!config.otlpEndpoint) return undefined;

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({ url: config.otlpEndpoint }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    void sdk.shutdown().finally(() => process.exit(0));
  });

  return sdk;
}
