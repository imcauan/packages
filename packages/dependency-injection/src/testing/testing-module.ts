import {
  DependencyContainer,
  Module,
  type DependencyModule,
  type InjectionToken,
  type ModuleMetadata,
  type Provider,
} from '../core/index.js';

export type TestingModuleMetadata = Pick<
  ModuleMetadata,
  'imports' | 'providers'
>;

/** Error thrown when a closed testing module is used for resolution. */
export class TestingModuleClosedError extends Error {
  constructor() {
    super('Testing module is closed');
    this.name = 'TestingModuleClosedError';
  }
}

/**
 * Compiled testing module.
 *
 * Exposes the underlying container for framework adapters and provides `get()`
 * for token resolution with testing lifecycle checks.
 */
export class TestingModule {
  private closed = false;

  constructor(readonly container: DependencyContainer) {}

  /** Resolves a token from the compiled testing module. */
  get<T>(token: InjectionToken<T>): T {
    if (this.closed) {
      throw new TestingModuleClosedError();
    }
    return this.container.resolve(token);
  }

  /**
   * Closes the testing module.
   *
   * This method is idempotent. Provider disposal hooks are not implemented yet,
   * and unresolved lazy providers are not instantiated during close.
   */
  async close(): Promise<void> {
    this.closed = true;
  }
}

/**
 * Fluent builder returned by `Test.createTestingModule()`.
 *
 * Overrides use the same provider shapes as production providers. The last
 * override registered for a token wins.
 */
export class TestingModuleBuilder {
  private readonly overrides: Provider[] = [];

  constructor(private readonly metadata: TestingModuleMetadata) {}

  /** Registers one provider override and returns this builder. */
  overrideProvider<T, Dependencies extends readonly unknown[]>(
    provider: Provider<T, Dependencies>,
  ): this {
    this.overrides.push(provider);
    return this;
  }

  /** Registers several provider overrides and returns this builder. */
  overrideProviders(providers: readonly Provider[]): this {
    this.overrides.push(...providers);
    return this;
  }

  /**
   * Builds and validates a testing module synchronously.
   *
   * Overrides are applied before validation and before provider instantiation.
   */
  compile(): TestingModule {
    const module = this.createRootModule();
    const container = DependencyContainer.create(module, {
      overrides: this.overrides,
    });

    return new TestingModule(container);
  }

  private createRootModule(): DependencyModule {
    const imports = this.metadata.imports ?? [];
    const providers = this.metadata.providers ?? [];

    const [singleImport] = imports;
    if (singleImport && imports.length === 1 && providers.length === 0) {
      return singleImport;
    }

    abstract class TestingRootModule {}
    Module({ imports, providers })(TestingRootModule);

    return TestingRootModule;
  }
}

/** Testing namespace for creating NestJS-inspired testing modules. */
export const Test = {
  /** Creates a testing-module builder from module-like metadata. */
  createTestingModule(metadata: TestingModuleMetadata): TestingModuleBuilder {
    return new TestingModuleBuilder(metadata);
  },
};
