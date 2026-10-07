import {
  Module,
  type DynamicModule,
  type FactoryProvider,
} from '@nestjs/common';
import { ConfigModule, type ConfigModuleOptions } from '@nestjs/config';
import type { Schema as ValidationSchema } from '@imcauan/validation';

import type { IEnvironment } from '../environment.port';
import {
  mergeEnvironmentSchemas,
  type MergedEnvironment,
} from '../merge-environment-schemas';

/** DI token every `EnvironmentGatewayModule.register` binds `IEnvironment` to. */
export const Environment = Symbol('Environment');

export type EnvironmentModuleOptions<
  TSchemas extends readonly ValidationSchema<object>[],
> = Omit<ConfigModuleOptions, 'validate'> & {
  /**
   * The schemas that together describe the app's full environment. Each is
   * validated independently against the raw environment and their outputs
   * are merged, so one invalid field doesn't hide failures from the other
   * schemas.
   */
  schemas: TSchemas;
};

/** Serves typed values from the validated environment object. */
function createEnvironment<Schema extends object>(
  values: Schema,
): IEnvironment<Schema> {
  return {
    get: ({ env }) => values[env],
  };
}

/**
 * Registers `@nestjs/config` with a validator built from `schemas`, and binds
 * an `IEnvironment` over the validated values to the `Environment` token.
 */
@Module({})
export class EnvironmentGatewayModule {
  static register<TSchemas extends readonly ValidationSchema<object>[]>(
    options: EnvironmentModuleOptions<TSchemas>,
  ): DynamicModule {
    const { schemas, ...configOptions } = options;
    const validate = mergeEnvironmentSchemas(schemas);
    let validated: MergedEnvironment<TSchemas> | undefined;

    const environmentProvider: FactoryProvider<
      IEnvironment<MergedEnvironment<TSchemas>>
    > = {
      provide: Environment,
      useFactory: () => {
        // ConfigModule validates while Nest resolves imports, before any
        // provider of this module is created.
        if (!validated) {
          throw new Error(
            '@imcauan/environment: the environment was read before ConfigModule validated it.',
          );
        }
        return createEnvironment(validated);
      },
    };

    return {
      module: EnvironmentGatewayModule,
      imports: [
        ConfigModule.forRoot({
          ...configOptions,
          validate: input => {
            validated = validate(input);
            return validated;
          },
        }),
      ],
      providers: [environmentProvider],
      exports: [Environment],
    };
  }
}
