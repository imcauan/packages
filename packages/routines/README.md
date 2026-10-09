# @imcauan/routines

Runs scheduled routines safely: a tick is skipped while the previous run is
still going, and a failing run is caught and logged instead of crashing the
process or stopping the schedule. Includes a NestJS module built on
[`@nestjs/schedule`](https://github.com/nestjs/schedule).

## Install

```bash
pnpm add @imcauan/routines
```

The core has no dependencies. For the NestJS module
(`@imcauan/routines/nestjs`):

```bash
pnpm add @nestjs/schedule cron
```

| Peer                             | Range     | Needed for                                |
| -------------------------------- | --------- | ----------------------------------------- |
| `@nestjs/common`, `@nestjs/core` | `^12.0.0` | `/nestjs` (your NestJS app has them)      |
| `@nestjs/schedule`               | `^12.0.0` | `/nestjs`                                 |
| `cron`                           | `^4.4.0`  | `/nestjs` (creates the jobs it registers) |

All of them are optional peers, so the core installs nothing NestJS-related.
See the [root README](../../README.md#install) to set up the GitHub Packages
registry.

## Usage

A routine's logic lives in a class that implements `IRoutineHandler`, with no
scheduling concerns. `RoutineRunner` wraps it for any scheduler that calls a
function on each tick:

```ts
import { RoutineRunner, type IRoutineHandler } from '@imcauan/routines';

class CleanupHandler implements IRoutineHandler {
  async execute(): Promise<void> {
    // ...
  }
}

const runner = new RoutineRunner('cleanup', new CleanupHandler());
setInterval(() => void runner.run(), 60_000);
```

`run()` never rejects:

- While a run is in flight, the next tick is skipped with a warning.
- When `execute()` throws, the error goes to the handler's `onError(error)`
  if it has one, or to the logger otherwise.

The logger is the third argument: anything with `warn(message)` and
`error(message, trace?)`, such as NestJS's `Logger`. Without it, messages go
to the console, prefixed with `[Routine:<name>]`.

## Integrations

### NestJS

Enable scheduling once, in the root module:

```ts
import { RoutinesModule } from '@imcauan/routines/nestjs';

@Module({ imports: [RoutinesModule.forRoot()] })
export class AppModule {}
```

Register routines in the module that owns them. `cron` takes a cron
expression; `@nestjs/schedule`'s `CronExpression` has common ones.

```ts
import { CronExpression } from '@nestjs/schedule';
import { RoutinesModule } from '@imcauan/routines/nestjs';

@Module({
  imports: [
    RoutinesModule.forFeature([
      {
        name: 'cleanup',
        cron: CronExpression.EVERY_HOUR,
        handler: CleanupHandler,
      },
    ]),
  ],
  providers: [CleanupHandler],
})
export class CleanupModule {}
```

Each `handler` class must be a provider somewhere in the app, either
`@Injectable()` or a factory provider keyed by the class:

```ts
providers: [
  {
    provide: CleanupHandler,
    inject: [FileStore],
    useFactory: (store: FileStore) => new CleanupHandler(store),
  },
];
```

It's resolved from the whole app's container, not only from the module that
calls `forFeature`. Each routine becomes a cron job in `SchedulerRegistry`
under its `name`, logged through a NestJS `Logger` with the context
`Routine:<name>`.

## API

`@imcauan/routines`

- `IRoutineHandler`: `execute(): Promise<void>` and an optional
  `onError(error)`.
- `IRoutineDefinition`: `{ name, cron, handler }`, where `handler` is a
  handler class.
- `RoutineRunner(name, handler, logger?)`: `run()` executes the handler with
  the overlap guard and error isolation.
- `ILogger`: the `warn` / `error` contract `RoutineRunner` logs to.
- `ConsoleLogger(context)`: the default `ILogger`, writing to the console.
- `Constructor<T>`: a class type, used by `IRoutineDefinition`.

`@imcauan/routines/nestjs`

- `RoutinesModule.forRoot()`: imports `ScheduleModule.forRoot()`.
- `RoutinesModule.forFeature(definitions)`: registers and starts one cron job
  per definition when the app initializes.
- `NestRoutineDefinition`: `IRoutineDefinition` with a Nest-injectable
  `handler`.

## Design notes

- The overlap guard is per runner, so per process. Several instances of an
  app each run their own schedule; use a lock in the handler if a routine
  must run once across instances.
- The package doesn't re-export `CronExpression`; import it from
  `@nestjs/schedule`.

## License

MIT
