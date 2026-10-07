import {
  CircularModuleError,
  DuplicateProviderError,
  InvalidModuleExportError,
  Module,
  UnresolvedProviderDependencyError,
  createInjectionToken,
} from '../../src';
import {
  Test,
  TestingModule,
  TestingModuleClosedError,
} from '../../src/testing';
import { makeGetUserFeatureStub } from '../mocks/get-user-feature.stub';
import { makeLoggerStub } from '../mocks/logger.stub';
import { makeUserRepositoryStub } from '../mocks/user-repository.stub';
import {
  AlternateLogger,
  ApplicationModule,
  ConsoleLogger,
  GetUserFeature,
  GetUserUseCase,
  Logger,
  LoggingModule,
  UserRepository,
  makeConsoleLoggerProvider,
  makeGetUserFeatureProvider,
  type Logger as LoggerType,
  type UserRepository as UserRepositoryType,
} from '../mocks/user-feature.fixtures';

const makeSut = (): typeof Test => Test;

describe('Test.createTestingModule', () => {
  describe('compile', () => {
    it('should return a testing module', () => {
      const sut = makeSut();
      const builder = sut.createTestingModule({});

      const moduleRef = builder.compile();

      expect(moduleRef).toBeInstanceOf(TestingModule);
    });

    it('should resolve a value provider', () => {
      const sut = makeSut();
      const loggerStub = makeLoggerStub();
      const moduleRef = sut
        .createTestingModule({
          providers: [{ provide: Logger, useValue: loggerStub }],
        })
        .compile();

      const logger = moduleRef.get(Logger);

      expect(logger).toBe(loggerStub);
    });

    it('should resolve a factory provider with its injected dependencies', () => {
      const sut = makeSut();
      const moduleRef = sut
        .createTestingModule({
          providers: [
            { provide: Logger, useValue: makeLoggerStub() },
            { provide: UserRepository, useValue: makeUserRepositoryStub() },
            makeGetUserFeatureProvider(),
          ],
        })
        .compile();

      const feature = moduleRef.get(GetUserFeature);

      expect(feature).toBeInstanceOf(GetUserUseCase);
    });

    it('should pass dependencies to a factory in inject order', () => {
      const sut = makeSut();
      const loggerStub = makeLoggerStub();
      const repositoryStub = makeUserRepositoryStub();
      const factory = vi.fn(
        (repository: UserRepositoryType, logger: LoggerType) =>
          new GetUserUseCase(repository, logger),
      );
      const moduleRef = sut
        .createTestingModule({
          providers: [
            { provide: Logger, useValue: loggerStub },
            { provide: UserRepository, useValue: repositoryStub },
            {
              provide: GetUserFeature,
              inject: [UserRepository, Logger],
              useFactory: factory,
            },
          ],
        })
        .compile();

      moduleRef.get(GetUserFeature);

      expect(factory).toHaveBeenCalledWith(repositoryStub, loggerStub);
    });

    it('should resolve providers exported by imported modules', () => {
      const sut = makeSut();
      const moduleRef = sut
        .createTestingModule({ imports: [LoggingModule] })
        .compile();

      const logger = moduleRef.get(Logger);

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should not call a factory before its token is resolved', () => {
      const sut = makeSut();
      const factory = vi.fn(() => new ConsoleLogger());
      const builder = sut.createTestingModule({
        providers: [{ provide: Logger, inject: [], useFactory: factory }],
      });

      builder.compile();

      expect(factory).not.toHaveBeenCalled();
    });

    it('should reject an override for a token no module provides', () => {
      const sut = makeSut();
      const UnknownService = createInjectionToken<object>('UnknownService');
      const builder = sut
        .createTestingModule({ imports: [LoggingModule] })
        .overrideProvider({ provide: UnknownService, useValue: {} });

      const compile = () => builder.compile();

      expect(compile).toThrow(/UnknownService/);
    });

    it('should reject a factory whose dependencies are missing', () => {
      const sut = makeSut();
      const builder = sut.createTestingModule({
        providers: [makeGetUserFeatureProvider()],
      });

      const compile = () => builder.compile();

      expect(compile).toThrow(UnresolvedProviderDependencyError);
    });

    it('should reject a module that exports a token it does not provide or import', () => {
      const sut = makeSut();
      @Module({ exports: [Logger] })
      class InvalidModule {}
      const builder = sut.createTestingModule({ imports: [InvalidModule] });

      const compile = () => builder.compile();

      expect(compile).toThrow(InvalidModuleExportError);
    });

    it('should reject circular module imports', () => {
      const sut = makeSut();
      @Module({})
      class FirstModule {}
      @Module({ imports: [FirstModule] })
      class SecondModule {}
      Module({ imports: [SecondModule] })(FirstModule);
      const builder = sut.createTestingModule({ imports: [FirstModule] });

      const compile = () => builder.compile();

      expect(compile).toThrow(CircularModuleError);
    });

    it('should reject the same token provided twice', () => {
      const sut = makeSut();
      const builder = sut.createTestingModule({
        providers: [
          makeConsoleLoggerProvider(),
          { provide: Logger, useValue: makeLoggerStub() },
        ],
      });

      const compile = () => builder.compile();

      expect(compile).toThrow(DuplicateProviderError);
    });
  });

  describe('overrideProvider', () => {
    it('should replace a provider declared by an imported module', () => {
      const sut = makeSut();
      const loggerStub = makeLoggerStub();
      const moduleRef = sut
        .createTestingModule({ imports: [LoggingModule] })
        .overrideProvider({ provide: Logger, useValue: loggerStub })
        .compile();

      const logger = moduleRef.get(Logger);

      expect(logger).toBe(loggerStub);
    });

    it('should replace a provider with a factory', () => {
      const sut = makeSut();
      const featureStub = makeGetUserFeatureStub();
      const moduleRef = sut
        .createTestingModule({ imports: [ApplicationModule] })
        .overrideProvider({
          provide: GetUserFeature,
          inject: [],
          useFactory: () => featureStub,
        })
        .compile();

      const feature = moduleRef.get(GetUserFeature);

      expect(feature).toBe(featureStub);
    });

    it('should inject other overrides into an overriding factory', () => {
      const sut = makeSut();
      const repositoryStub = makeUserRepositoryStub();
      const factory = vi.fn((_repository: UserRepositoryType) =>
        makeGetUserFeatureStub(),
      );
      const moduleRef = sut
        .createTestingModule({ imports: [ApplicationModule] })
        .overrideProvider({
          provide: GetUserFeature,
          inject: [UserRepository],
          useFactory: factory,
        })
        .overrideProvider({ provide: UserRepository, useValue: repositoryStub })
        .compile();

      moduleRef.get(GetUserFeature);

      expect(factory).toHaveBeenCalledWith(repositoryStub);
    });

    it('should replace a provider with an alias', () => {
      const sut = makeSut();
      const loggerStub = makeLoggerStub();
      @Module({
        providers: [{ provide: AlternateLogger, useValue: loggerStub }],
        exports: [AlternateLogger],
      })
      class AlternateLoggingModule {}
      const moduleRef = sut
        .createTestingModule({
          imports: [ApplicationModule, AlternateLoggingModule],
        })
        .overrideProvider({ provide: Logger, useExisting: AlternateLogger })
        .compile();

      const logger = moduleRef.get(Logger);

      expect(logger).toBe(loggerStub);
    });

    it('should not call the factory of a replaced provider', () => {
      const sut = makeSut();
      const originalFactory = vi.fn(() => new ConsoleLogger());
      @Module({
        providers: [
          { provide: Logger, inject: [], useFactory: originalFactory },
        ],
        exports: [Logger],
      })
      class OriginalLoggingModule {}
      const moduleRef = sut
        .createTestingModule({ imports: [OriginalLoggingModule] })
        .overrideProvider({ provide: Logger, useValue: makeLoggerStub() })
        .compile();

      moduleRef.get(Logger);

      expect(originalFactory).not.toHaveBeenCalled();
    });

    it('should use the last override registered for a token', () => {
      const sut = makeSut();
      const lastLogger = makeLoggerStub();
      const moduleRef = sut
        .createTestingModule({ imports: [LoggingModule] })
        .overrideProvider({ provide: Logger, useValue: makeLoggerStub() })
        .overrideProvider({ provide: Logger, useValue: lastLogger })
        .compile();

      const logger = moduleRef.get(Logger);

      expect(logger).toBe(lastLogger);
    });

    it('should return the builder', () => {
      const sut = makeSut();
      const builder = sut.createTestingModule({ imports: [LoggingModule] });

      const result = builder.overrideProvider({
        provide: Logger,
        useValue: makeLoggerStub(),
      });

      expect(result).toBe(builder);
    });

    it('should type factory arguments from the inject tokens', () => {
      const sut = makeSut();
      const builder = sut.createTestingModule({ imports: [ApplicationModule] });

      builder.overrideProvider({
        provide: GetUserFeature,
        inject: [UserRepository, Logger],
        useFactory: (repository, logger) => {
          expectTypeOf(repository).toEqualTypeOf<UserRepositoryType>();
          expectTypeOf(logger).toEqualTypeOf<LoggerType>();
          return new GetUserUseCase(repository, logger);
        },
      });
    });
  });

  describe('overrideProviders', () => {
    it('should replace several providers', () => {
      const sut = makeSut();
      const loggerStub = makeLoggerStub();
      const repositoryStub = makeUserRepositoryStub();
      const moduleRef = sut
        .createTestingModule({ imports: [ApplicationModule] })
        .overrideProviders([
          { provide: Logger, useValue: loggerStub },
          { provide: UserRepository, useValue: repositoryStub },
        ])
        .compile();

      const resolved = {
        logger: moduleRef.get(Logger),
        repository: moduleRef.get(UserRepository),
      };

      expect(resolved).toEqual({
        logger: loggerStub,
        repository: repositoryStub,
      });
    });

    it('should return the builder', () => {
      const sut = makeSut();
      const builder = sut.createTestingModule({ imports: [LoggingModule] });

      const result = builder.overrideProviders([
        { provide: Logger, useValue: makeLoggerStub() },
      ]);

      expect(result).toBe(builder);
    });
  });

  describe('isolation', () => {
    it('should return the same instance within one testing module', () => {
      const sut = makeSut();
      const moduleRef = sut
        .createTestingModule({ providers: [makeConsoleLoggerProvider()] })
        .compile();
      const first = moduleRef.get(Logger);

      const second = moduleRef.get(Logger);

      expect(second).toBe(first);
    });

    it('should create separate instances for separate testing modules', () => {
      const sut = makeSut();
      const firstModule = sut
        .createTestingModule({ providers: [makeConsoleLoggerProvider()] })
        .compile();
      const secondModule = sut
        .createTestingModule({ providers: [makeConsoleLoggerProvider()] })
        .compile();

      const first = firstModule.get(Logger);
      const second = secondModule.get(Logger);

      expect(first).not.toBe(second);
    });

    it('should not carry overrides over to another testing module', () => {
      const sut = makeSut();
      sut
        .createTestingModule({ imports: [LoggingModule] })
        .overrideProvider({ provide: Logger, useValue: makeLoggerStub() })
        .compile();
      const moduleRef = sut
        .createTestingModule({ imports: [LoggingModule] })
        .compile();

      const logger = moduleRef.get(Logger);

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });
  });

  describe('close', () => {
    it('should not call factories of unresolved providers', async () => {
      const sut = makeSut();
      const factory = vi.fn(() => new ConsoleLogger());
      const moduleRef = sut
        .createTestingModule({
          providers: [{ provide: Logger, inject: [], useFactory: factory }],
        })
        .compile();

      await moduleRef.close();

      expect(factory).not.toHaveBeenCalled();
    });

    it('should reject resolution after the testing module is closed', async () => {
      const sut = makeSut();
      const moduleRef = sut
        .createTestingModule({ providers: [makeConsoleLoggerProvider()] })
        .compile();
      await moduleRef.close();

      const get = () => moduleRef.get(Logger);

      expect(get).toThrow(TestingModuleClosedError);
    });

    it('should allow closing more than once', async () => {
      const sut = makeSut();
      const moduleRef = sut.createTestingModule({}).compile();
      await moduleRef.close();

      const promise = moduleRef.close();

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
