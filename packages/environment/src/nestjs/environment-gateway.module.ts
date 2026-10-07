import {
  Module,
  type DynamicModule,
  type FactoryProvider,
} from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
  type ConfigModuleOptions,
} from '@nestjs/config';
import type { Schema as ValidationSchema } from '@imcauan/validation';

import type { IEnvironment } from '../environment.port';
import { mergeEnvironmentSchemas } from '../merge-environment-schemas';
import { NestJsEnvironmentAdapter } from './nestjs-environment.adapter';

/** DI token every `EnvironmentGatewayModule.register` binds `IEnvironment` to. */
export const Environment = Symbol('Environment');

export type EnvironmentModuleOptions<Schema extends Record<string, unknown>> =
  Omit<ConfigModuleOptions, 'validate'> & {
    /**
     * The schemas that together describe the app's full environment. Each is
     * validated independently against the raw environment and their outputs
     * are merged, so one invalid field doesn't hide failures from the other
     * schemas.
     */
    schemas: ValidationSchema<Partial<Schema>>[];
  };

/**
 * Registers `@nestjs/config` and binds `IEnvironment<Schema>` to the
 * `Environment` token, so consumers inject `Environment` typed as
 * `IEnvironment<Schema>` without an app-local provider.
 */
@Module({})
export class EnvironmentGatewayModule {
  static register<Schema extends Record<string, unknown>>(
    options: EnvironmentModuleOptions<Schema>,
  ): DynamicModule {
    const { schemas, ...configOptions } = options;

    const environmentProvider: FactoryProvider = {
      provide: Environment,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Schema, true>,
      ): IEnvironment<Schema> => new NestJsEnvironmentAdapter(configService),
    };

    return {
      module: EnvironmentGatewayModule,
      imports: [
        ConfigModule.forRoot({
          ...configOptions,
          validate: mergeEnvironmentSchemas<Schema>(schemas),
        }),
      ],
      providers: [environmentProvider],
      exports: [Environment],
    };
  }
}
