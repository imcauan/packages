# @imcauan/logger

Structured logging with OpenTelemetry trace correlation, with a NestJS module
built on [`nestjs-pino`](https://github.com/iamolegga/nestjs-pino).

## Install

```bash
pnpm add @imcauan/logger @opentelemetry/api
```

`@opentelemetry/api` (`^1.9.0`) is a required peer.

For the NestJS module (`@imcauan/logger/nestjs`):

```bash
pnpm add nestjs-pino pino pino-http

# optional transports
pnpm add pino-pretty   # pretty output (the default outside production)
pnpm add pino-loki     # shipping logs to Grafana Loki
```

| Peer                             | Range     | Needed for                                                       |
| -------------------------------- | --------- | ---------------------------------------------------------------- |
| `@nestjs/common`, `@nestjs/core` | `^12.0.0` | `/nestjs` (your NestJS app has them)                             |
| `nestjs-pino`                    | `^5.1.0`  | `/nestjs`                                                        |
| `pino`                           | `^10.0.0` | `/nestjs` (peer of `nestjs-pino`, and the JSON stdout transport) |
| `pino-http`                      | `^11.0.0` | `/nestjs` (peer of `nestjs-pino`)                                |
| `pino-pretty`                    | `^13.0.0` | `/nestjs` with pretty output                                     |
| `pino-loki`                      | `^3.0.0`  | `/nestjs` with `lokiUrl`                                         |

All of them are optional peers, so the core installs nothing NestJS-related.
See the [root README](../../README.md#install) to set up the GitHub Packages
registry.

## Usage

The core exports `traceMixin`, a pino
[`mixin`](https://getpino.io/#/docs/api?id=mixin-function) that adds the
active OpenTelemetry span's ids to every log line:

```ts
import pino from 'pino';
import { traceMixin } from '@imcauan/logger';

const logger = pino({ mixin: traceMixin });

logger.info('order created');
// {"level":30,"msg":"order created","trace_id":"0af7…","span_id":"b7ad…",...}
```

With `trace_id` and `span_id` on each line, a log backend such as Grafana can
link a log line to its trace and back. When there's no active span (no
OpenTelemetry SDK is registered, or the log happens outside a traced
operation), the mixin adds nothing and never throws. Register the
OpenTelemetry SDK before your app starts if you want the ids.

## Integrations

### NestJS

```ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '@imcauan/logger/nestjs';

@Module({
  imports: [
    LoggerModule.forRoot({
      serviceName: 'my-service',
      env: process.env.NODE_ENV ?? 'development',
      lokiUrl: process.env.LOKI_PUSH_URL, // optional
      level: process.env.LOG_LEVEL, // optional, defaults to 'info'
    }),
  ],
})
export class AppModule {}
```

Then make Nest use it, as `nestjs-pino` recommends:

```ts
import { Logger } from '@imcauan/logger/nestjs';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

`bufferLogs: true` keeps the log lines Nest writes before `useLogger` runs.

| Option        | Effect                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `serviceName` | The logger's `name`, and the `service` label in Loki                                                      |
| `env`         | Pretty output everywhere except `'production'`, which writes JSON to stdout. Also the `env` label in Loki |
| `lokiUrl`     | Optional. Also pushes logs to this Loki endpoint, labeled `{ service, env }`                              |
| `level`       | Optional pino level. Defaults to `'info'`                                                                 |
| `pretty`      | Optional. Forces pretty output on or off, whatever `env` says                                             |

If pretty output or Loki is enabled but `pino-pretty` or `pino-loki` isn't
installed, `forRoot` throws an error that says which package to add.

## API

`@imcauan/logger`

- `traceMixin()`: returns `{ trace_id, span_id }` for the active span, or `{}`.
- `LoggerConfig`: the options above.

`@imcauan/logger/nestjs`

- `LoggerModule.forRoot(config)`: a dynamic module that configures
  `nestjs-pino`.
- `Logger`: `nestjs-pino`'s Nest logger, re-exported.

## Design notes

- Transports are resolved from this package's own location
  (`import.meta.resolve`) and handed to pino as file URLs. pino would
  otherwise look them up from the file that created the logger, which
  breaks under strict layouts such as pnpm without hoisting.
- `@opentelemetry/api` is a peer, not a dependency, because the API must be a
  single copy shared with the SDK your app registers.

## License

MIT
