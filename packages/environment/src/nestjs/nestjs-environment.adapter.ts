import type { ConfigService } from '@nestjs/config';

import type { IEnvironment } from '../environment.port';

/** Generic adapter wrapping NestJS `ConfigService<Schema, true>`. */
export class NestJsEnvironmentAdapter<
  Schema extends Record<string, unknown>,
> implements IEnvironment<Schema> {
  constructor(private readonly configService: ConfigService<Schema, true>) {}

  get<K extends keyof Schema>(params: { env: K }): Schema[K] {
    // `ConfigService`'s `Path<Schema>` key type can't be derived from a
    // generic `Schema` type parameter the way it can from a concrete
    // object type, so the key/return types are asserted here instead;
    // callers stay fully typed through the `IEnvironment<Schema>` port.
    return this.configService.get(
      params.env as unknown as never,
      { infer: true } as never,
    );
  }
}
