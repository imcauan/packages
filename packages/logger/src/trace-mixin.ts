import { trace } from '@opentelemetry/api';

/**
 * pino `mixin()` that stamps every log line with the active OTel trace
 * context (`trace_id`/`span_id`), so a log backend such as Grafana can
 * correlate a log line with its trace/span. Returns an empty object when there's no active span
 * (no OpenTelemetry SDK is registered, or the log happened outside a
 * traced request) --- never throws.
 */
export function traceMixin(): Record<string, string> {
  const spanContext = trace.getActiveSpan()?.spanContext();

  if (!spanContext) {
    return {};
  }

  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}
