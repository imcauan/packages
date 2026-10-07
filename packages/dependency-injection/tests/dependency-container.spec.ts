import {
  CircularModuleError,
  CircularProviderError,
  DependencyContainer,
  DuplicateProviderError,
  InvalidModuleError,
  InvalidModuleExportError,
  MissingProviderError,
  Module,
  UnresolvedProviderDependencyError,
  createInjectionToken,
  defineModule,
} from '../src';
import {
  ApplicationModule,
  ConsoleLogger,
  GetUserFeature,
  GetUserUseCase,
  Logger,
  LoggingModule,
} from './mocks/user-feature.fixtures';

const makeSut = (): typeof DependencyContainer => DependencyContainer;

describe('DependencyContainer', () => {
  describe('resolve', () => {
    it('should resolve a factory provider with its injected dependencies', () => {
      const sut = makeSut();
      const container = sut.create(ApplicationModule);

      const feature = container.resolve(GetUserFeature);

      expect(feature).toBeInstanceOf(GetUserUseCase);
    });

    it('should resolve a value provider', () => {
      const sut = makeSut();
      const Value = createInjectionToken<string>('Value');
      @Module({ providers: [{ provide: Value, useValue: 'any-value' }] })
      class ValueModule {}
      const container = sut.create(ValueModule);

      const value = container.resolve(Value);

      expect(value).toBe('any-value');
    });

    it('should resolve an existing provider to the instance of its target', () => {
      const sut = makeSut();
      const Alias = createInjectionToken<Logger>('Alias');
      @Module({
        imports: [LoggingModule],
        providers: [{ provide: Alias, useExisting: Logger }],
      })
      class AliasModule {}
      const container = sut.create(AliasModule);

      const alias = container.resolve(Alias);

      expect(alias).toBe(container.resolve(Logger));
    });

    it('should return the same instance on every call', () => {
      const sut = makeSut();
      const container = sut.create(ApplicationModule);
      const first = container.resolve(Logger);

      const second = container.resolve(Logger);

      expect(second).toBe(first);
    });

    it('should not call a factory before its token is resolved', () => {
      const sut = makeSut();
      const factory = vi.fn(() => new ConsoleLogger());
      @Module({
        providers: [{ provide: Logger, inject: [], useFactory: factory }],
      })
      class LazyModule {}

      sut.create(LazyModule);

      expect(factory).not.toHaveBeenCalled();
    });

    it('should call a factory once, however often its token is resolved', () => {
      const sut = makeSut();
      const factory = vi.fn(() => new ConsoleLogger());
      @Module({
        providers: [{ provide: Logger, inject: [], useFactory: factory }],
      })
      class LazyModule {}
      const container = sut.create(LazyModule);

      container.resolve(Logger);
      container.resolve(Logger);

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should resolve a token exported through imported modules', () => {
      const sut = makeSut();
      @Module({ imports: [ApplicationModule] })
      class AppModule {}
      const container = sut.create(AppModule);

      const logger = container.resolve(Logger);

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should throw MissingProviderError for a token an imported module does not export', () => {
      const sut = makeSut();
      const Private = createInjectionToken<string>('Private');
      @Module({ providers: [{ provide: Private, useValue: 'any-value' }] })
      class PrivateModule {}
      @Module({ imports: [PrivateModule] })
      class AppModule {}
      const container = sut.create(AppModule);

      const resolve = () => container.resolve(Private);

      expect(resolve).toThrow(MissingProviderError);
    });
  });

  describe('create', () => {
    it('should reject a factory that injects a token its module cannot see', () => {
      const sut = makeSut();
      const Private = createInjectionToken<string>('Private');
      @Module({ providers: [{ provide: Private, useValue: 'any-value' }] })
      class PrivateModule {}
      @Module({
        imports: [PrivateModule],
        providers: [
          {
            provide: Logger,
            inject: [Private],
            useFactory: () => new ConsoleLogger(),
          },
        ],
      })
      class FeatureModule {}

      const create = () => sut.create(FeatureModule);

      expect(create).toThrow(UnresolvedProviderDependencyError);
    });

    it('should reject an alias to a token its module cannot see', () => {
      const sut = makeSut();
      const Private = createInjectionToken<string>('Private');
      const Public = createInjectionToken<string>('Public');
      @Module({ providers: [{ provide: Private, useValue: 'any-value' }] })
      class PrivateModule {}
      @Module({
        imports: [PrivateModule],
        providers: [{ provide: Public, useExisting: Private }],
      })
      class PublicModule {}

      const create = () => sut.create(PublicModule);

      expect(create).toThrow(UnresolvedProviderDependencyError);
    });

    it('should reject a module that exports a token it does not provide or import', () => {
      const sut = makeSut();
      @Module({ exports: [Logger] })
      class InvalidModule {}

      const create = () => sut.create(InvalidModule);

      expect(create).toThrow(InvalidModuleExportError);
    });

    it('should reject the same token provided by two modules', () => {
      const sut = makeSut();
      @Module({
        providers: [{ provide: Logger, useValue: new ConsoleLogger() }],
      })
      class FirstModule {}
      @Module({
        providers: [{ provide: Logger, useValue: new ConsoleLogger() }],
      })
      class SecondModule {}
      @Module({ imports: [FirstModule, SecondModule] })
      class AppModule {}

      const create = () => sut.create(AppModule);

      expect(create).toThrow(DuplicateProviderError);
    });

    it('should reject a class without @Module', () => {
      const sut = makeSut();
      class UndecoratedModule {}

      const create = () => sut.create(UndecoratedModule);

      expect(create).toThrow(InvalidModuleError);
    });

    it('should reject circular module imports', () => {
      const sut = makeSut();
      @Module({})
      class FirstModule {}
      @Module({ imports: [FirstModule] })
      class SecondModule {}
      Module({ imports: [SecondModule] })(FirstModule);

      const create = () => sut.create(FirstModule);

      expect(create).toThrow(CircularModuleError);
    });

    it('should reject factories that depend on each other', () => {
      const sut = makeSut();
      const First = createInjectionToken<string>('First');
      const Second = createInjectionToken<string>('Second');
      @Module({
        providers: [
          {
            provide: First,
            inject: [Second],
            useFactory: (second: string) => second,
          },
          {
            provide: Second,
            inject: [First],
            useFactory: (first: string) => first,
          },
        ],
      })
      class CircularModule {}

      const create = () => sut.create(CircularModule);

      expect(create).toThrow(CircularProviderError);
    });

    it('should reject aliases that point to each other', () => {
      const sut = makeSut();
      const First = createInjectionToken<string>('First');
      const Second = createInjectionToken<string>('Second');
      @Module({
        providers: [
          { provide: First, useExisting: Second },
          { provide: Second, useExisting: First },
        ],
      })
      class CircularModule {}

      const create = () => sut.create(CircularModule);

      expect(create).toThrow(CircularProviderError);
    });
  });

  describe('override', () => {
    it('should resolve a value provider added by override', () => {
      const sut = makeSut();
      const container = sut.create();
      const Value = createInjectionToken<string>('Value');
      container.override({ provide: Value, useValue: 'any-value' });

      const value = container.resolve(Value);

      expect(value).toBe('any-value');
    });

    it('should resolve an alias added by override', () => {
      const sut = makeSut();
      const container = sut.create();
      const Value = createInjectionToken<string>('Value');
      const Alias = createInjectionToken<string>('Alias');
      container.override({ provide: Value, useValue: 'any-value' });
      container.override({ provide: Alias, useExisting: Value });

      const alias = container.resolve(Alias);

      expect(alias).toBe('any-value');
    });

    it('should resolve a factory added by override', () => {
      const sut = makeSut();
      const container = sut.create();
      const Value = createInjectionToken<string>('Value');
      const Factory = createInjectionToken<string>('Factory');
      container.override({ provide: Value, useValue: 'any-value' });
      container.override({
        provide: Factory,
        inject: [Value],
        useFactory: (value: string) => `${value}-factory`,
      });

      const result = container.resolve(Factory);

      expect(result).toBe('any-value-factory');
    });

    it('should replace an instance that was already resolved', () => {
      const sut = makeSut();
      const container = sut.create(LoggingModule);
      container.resolve(Logger);
      const replacement = new ConsoleLogger();
      container.override({ provide: Logger, useValue: replacement });

      const logger = container.resolve(Logger);

      expect(logger).toBe(replacement);
    });
  });

  describe('hasProvider', () => {
    it('should report a token that has a provider', () => {
      const sut = makeSut();
      const container = sut.create(LoggingModule);

      const result = container.hasProvider(Logger);

      expect(result).toBe(true);
    });

    it('should report a token without a provider', () => {
      const sut = makeSut();
      const container = sut.create(LoggingModule);

      const result = container.hasProvider(GetUserFeature);

      expect(result).toBe(false);
    });
  });

  describe('defineModule', () => {
    it('should load a module defined from metadata', () => {
      const sut = makeSut();
      const Value = createInjectionToken<string>('Value');
      const module = defineModule({
        name: 'any-name',
        providers: [{ provide: Value, useValue: 'any-value' }],
      });
      const container = sut.create(module);

      const value = container.resolve(Value);

      expect(value).toBe('any-value');
    });
  });
});

describe('createInjectionToken', () => {
  it('should create a distinct token on every call, even with the same description', () => {
    const sut = createInjectionToken;

    const first = sut('any-description');
    const second = sut('any-description');

    expect(first).not.toBe(second);
  });
});
