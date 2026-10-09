# @imcauan/tracing

Starts OpenTelemetry tracing in a Node app: auto-instrumentation for common
libraries and an OTLP/HTTP trace exporter.

## Install

```bash
pnpm add @imcauan/tracing @opentelemetry/api
```

`@opentelemetry/api` (`^1.9.0`) is a required peer. The OpenTelemetry SDK
packages are regular dependencies and install with the package. See the
[root README](../../README.md#install) to set up the GitHub Packages registry.

The package runs in Node only: it starts the OpenTelemetry Node SDK
([ADR 0009](../../docs/adr/0009-tracing-node-only-core.md)).

## Usage

Tracing must start before the app loads anything else.
Auto-instrumentation patches modules (`http`, `express`, `@nestjs/core` and
others) as they load, so a module loaded before tracing starts isn't traced.

In an app compiled to CommonJS (a default NestJS app, for example), imports
run in order, so calling `initTracing` at the top of the entry point works:

```ts
// main.ts: the first lines of the entry point
import { initTracing } from '@imcauan/tracing';

initTracing({
  serviceName: 'my-service',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
});

// every other import goes below
import { NestFactory } from '@nestjs/core';
```

Without `otlpEndpoint`, tracing is skipped and `initTracing` returns
`undefined`, so the app runs the same where no collector is available, such
as local development.

With the endpoint set, it starts the SDK and returns it. On `SIGTERM` it
flushes pending spans and exits the process with code `0`.

### Starting from environment variables

`@imcauan/tracing/register` calls `initTracing` as soon as it's imported,
with:

| Variable                      | Used as                                   |
| ----------------------------- | ----------------------------------------- |
| `OTEL_SERVICE_NAME`           | `serviceName` (default `unknown-service`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `otlpEndpoint`                            |

```ts
// main.ts
import '@imcauan/tracing/register';

import { NestFactory } from '@nestjs/core';
```

In an ES module app, use this entry: ES modules load all of a file's imports
before running its code, so an `initTracing` call at the top of the file runs
too late. A first import of `register` runs before the imports after it.

### With `@imcauan/logger`

Once tracing has started, [`@imcauan/logger`](../logger) adds the active
span's `trace_id` and `span_id` to every log line. W3C `traceparent` headers
are propagated by the HTTP instrumentation, so requests between services that
both use this package join the same trace.

## API

`@imcauan/tracing`

- `initTracing(config)`: starts tracing and returns the `NodeSDK`, or
  `undefined` without `otlpEndpoint`.
- `TracingConfig`: `{ serviceName: string; otlpEndpoint?: string }`.

`@imcauan/tracing/register`

- No exports. Importing it calls `initTracing` from the environment variables
  above.

## Design notes

- The `SIGTERM` handler exits the process after flushing spans. If your app
  has its own shutdown sequence on `SIGTERM`, account for this exit.
- `@opentelemetry/api` is a peer, not a dependency, because the API must be
  a single copy shared by the SDK and anything that reads spans, such as
  `@imcauan/logger`.

## License

MIT
