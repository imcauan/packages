import { createInjectionToken, Module, type FactoryProvider } from '../../src';

export type User = { id: string; name: string };

export interface Logger {
  log(message: string): void;
}

export interface UserRepository {
  findById(id: string): Promise<User>;
}

export interface GetUserFeature {
  execute(id: string): Promise<User>;
}

export const Logger = createInjectionToken<Logger>('Logger');
export const AlternateLogger = createInjectionToken<Logger>('AlternateLogger');
export const UserRepository =
  createInjectionToken<UserRepository>('UserRepository');
export const GetUserFeature =
  createInjectionToken<GetUserFeature>('GetUserFeature');

export class ConsoleLogger implements Logger {
  log(): void {}
}

class RemoteUserRepository implements UserRepository {
  async findById(id: string): Promise<User> {
    return { id, name: 'any-name' };
  }
}

export class GetUserUseCase implements GetUserFeature {
  constructor(
    private readonly repository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async execute(id: string): Promise<User> {
    this.logger.log(`Loading user ${id}`);
    return this.repository.findById(id);
  }
}

export const makeConsoleLoggerProvider = (): FactoryProvider<Logger, []> => ({
  provide: Logger,
  inject: [],
  useFactory: () => new ConsoleLogger(),
});

const makeRemoteUserRepositoryProvider = (): FactoryProvider<
  UserRepository,
  []
> => ({
  provide: UserRepository,
  inject: [],
  useFactory: () => new RemoteUserRepository(),
});

export const makeGetUserFeatureProvider = (): FactoryProvider<
  GetUserFeature,
  [UserRepository, Logger]
> => ({
  provide: GetUserFeature,
  inject: [UserRepository, Logger],
  useFactory: (repository, logger) => new GetUserUseCase(repository, logger),
});

@Module({
  providers: [makeConsoleLoggerProvider()],
  exports: [Logger],
})
export class LoggingModule {}

@Module({
  providers: [makeRemoteUserRepositoryProvider()],
  exports: [UserRepository],
})
class UserRepositoryModule {}

@Module({
  imports: [LoggingModule, UserRepositoryModule],
  providers: [makeGetUserFeatureProvider()],
  exports: [Logger, UserRepository, GetUserFeature],
})
export class ApplicationModule {}
