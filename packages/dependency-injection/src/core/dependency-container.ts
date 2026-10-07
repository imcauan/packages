import {
  getModuleMetadata,
  getModuleName,
  hasModuleMetadata,
  type DependencyModule,
} from './dependency-module.js';
import {
  CircularModuleError,
  CircularProviderError,
  DuplicateProviderError,
  InvalidModuleError,
  InvalidModuleExportError,
  MissingProviderError,
  UnresolvedProviderDependencyError,
} from './errors.js';
import type { InjectionToken } from './injection-token.js';
import {
  isExistingProvider,
  isFactoryProvider,
  isValueProvider,
  type ExistingProvider,
  type Provider,
} from './provider.js';

type ModuleRecord = {
  module: DependencyModule;
  imports: readonly DependencyModule[];
  providers: readonly Provider[];
  exports: readonly InjectionToken<unknown>[];
  localTokens: Set<symbol>;
  visibleTokens: Set<symbol>;
  exportedTokens: Set<symbol>;
};

export type DependencyContainerOptions = {
  /**
   * Providers that replace providers declared in the loaded module graph.
   *
   * This is primarily used by the testing API so overrides are applied before
   * validation and before any lazy provider can be instantiated.
   */
  overrides?: readonly Provider[];
};

/**
 * Single-container dependency resolver.
 *
 * The container builds and validates one module graph, then lazily resolves
 * typed tokens from that graph. It does not create child containers or module
 * scopes.
 */
export class DependencyContainer {
  private readonly providers = new Map<symbol, Provider>();
  private readonly instances = new Map<symbol, unknown>();
  private readonly publicTokens = new Set<symbol>();
  private readonly resolving = new Set<symbol>();

  private constructor() {}

  static create(
    module?: DependencyModule,
    options: DependencyContainerOptions = {},
  ): DependencyContainer {
    const container = new DependencyContainer();
    if (module) {
      container.load(module, options);
    }
    return container;
  }

  /**
   * Loads a root module graph into this container.
   *
   * Loading validates module imports, exports, duplicate providers, provider
   * visibility, and circular dependencies. Factory providers remain lazy.
   */
  load(
    module: DependencyModule,
    options: DependencyContainerOptions = {},
  ): void {
    const records = new Map<DependencyModule, ModuleRecord>();
    this.collectModules(module, records, []);
    this.validateProviderDuplicates(records);
    const overriddenTokens = this.applyProviderOverrides(
      records,
      options.overrides ?? [],
    );
    this.registerProviders(records);
    this.validateModuleVisibility(records, module, overriddenTokens);
    this.validateProviderCycles();
    this.publicTokens.clear();
    const rootRecord = records.get(module);
    if (rootRecord) {
      for (const token of rootRecord.visibleTokens) {
        this.publicTokens.add(token);
      }
    }
  }

  /**
   * Explicitly replaces or adds a provider on this container.
   *
   * Prefer `Test.createTestingModule().overrideProvider()` in application
   * tests. This low-level method is useful for focused container tests and
   * advanced manual composition.
   */
  override<T, Dependencies extends readonly unknown[]>(
    provider: Provider<T, Dependencies>,
  ): void {
    this.providers.set(provider.provide, provider);
    this.instances.delete(provider.provide);
    this.publicTokens.add(provider.provide);
  }

  /** Returns whether a provider descriptor exists for the token. */
  hasProvider(token: InjectionToken<unknown>): boolean {
    return this.providers.has(token);
  }

  /**
   * Resolves a visible token, instantiating its provider lazily if necessary.
   *
   * Only tokens visible from the loaded root module can be resolved publicly.
   */
  resolve<T>(token: InjectionToken<T>): T {
    if (!this.publicTokens.has(token)) {
      throw new MissingProviderError(token);
    }
    return this.resolveProvider(token);
  }

  private resolveProvider<T>(token: InjectionToken<T>): T {
    if (this.instances.has(token)) {
      // The injection token is the runtime witness for the cached value's type.
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return this.instances.get(token) as T;
    }

    const provider = this.providers.get(token);

    if (!provider) {
      throw new MissingProviderError(token);
    }

    if (this.resolving.has(token)) {
      throw new CircularProviderError(token);
    }

    this.resolving.add(token);
    try {
      if (isValueProvider(provider)) {
        this.instances.set(token, provider.useValue);
        // Provider registration ties this instance to the requested typed token.
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        return provider.useValue as T;
      }

      if (isExistingProvider(provider)) {
        // Provider registration ties the alias provider to the requested token.
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        return this.resolveExistingProvider(provider as ExistingProvider<T>);
      }

      const dependencies = provider.inject.map(dependency =>
        this.resolveProvider(dependency),
      );
      const instance = provider.useFactory(...dependencies);
      this.instances.set(token, instance);
      // Provider registration ties this instance to the requested typed token.
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return instance as T;
    } finally {
      this.resolving.delete(token);
    }
  }

  private collectModules(
    module: DependencyModule,
    records: Map<DependencyModule, ModuleRecord>,
    loadingPath: readonly DependencyModule[],
  ): ModuleRecord {
    if (!hasModuleMetadata(module)) {
      throw new InvalidModuleError(getModuleName(module));
    }

    const existing = records.get(module);
    if (existing) {
      return existing;
    }

    if (loadingPath.includes(module)) {
      const cycle = [...loadingPath.slice(loadingPath.indexOf(module)), module];
      throw new CircularModuleError(cycle.map(getModuleName));
    }

    const metadata = getModuleMetadata(module);
    for (const importedModule of metadata.imports) {
      this.collectModules(importedModule, records, [...loadingPath, module]);
    }

    const localTokens = new Set<symbol>();
    for (const provider of metadata.providers) {
      if (localTokens.has(provider.provide)) {
        throw new DuplicateProviderError(provider.provide);
      }
      localTokens.add(provider.provide);
    }

    const record: ModuleRecord = {
      module,
      imports: metadata.imports,
      providers: metadata.providers,
      exports: metadata.exports,
      localTokens,
      visibleTokens: new Set(localTokens),
      exportedTokens: new Set(),
    };
    records.set(module, record);

    return record;
  }

  private validateProviderDuplicates(
    records: ReadonlyMap<DependencyModule, ModuleRecord>,
  ): void {
    const registered = new Set<symbol>();
    for (const record of records.values()) {
      for (const token of record.localTokens) {
        if (registered.has(token)) {
          throw new DuplicateProviderError(token);
        }
        registered.add(token);
      }
    }
  }

  private applyProviderOverrides(
    records: ReadonlyMap<DependencyModule, ModuleRecord>,
    overrides: readonly Provider[],
  ): ReadonlySet<symbol> {
    const overriddenTokens = new Set<symbol>();
    if (overrides.length === 0) {
      return overriddenTokens;
    }

    const existingTokens = new Set<symbol>();
    for (const record of records.values()) {
      for (const token of record.localTokens) {
        existingTokens.add(token);
      }
    }

    for (const override of overrides) {
      if (!existingTokens.has(override.provide)) {
        throw new MissingProviderError(override.provide);
      }
    }

    const overridesByToken = new Map<symbol, Provider>();
    for (const override of overrides) {
      overridesByToken.set(override.provide, override);
      overriddenTokens.add(override.provide);
    }

    for (const record of records.values()) {
      const providers = record.providers.map(
        provider => overridesByToken.get(provider.provide) ?? provider,
      );
      record.providers = Object.freeze(providers);
    }

    return overriddenTokens;
  }

  private registerProviders(
    records: ReadonlyMap<DependencyModule, ModuleRecord>,
  ): void {
    this.providers.clear();
    this.instances.clear();
    for (const record of records.values()) {
      for (const provider of record.providers) {
        this.providers.set(provider.provide, provider);
      }
    }
  }

  private validateModuleVisibility(
    records: ReadonlyMap<DependencyModule, ModuleRecord>,
    rootModule: DependencyModule,
    overriddenTokens: ReadonlySet<symbol>,
  ): void {
    for (const record of records.values()) {
      this.populateVisibleAndExportedTokens(record, records);
    }

    const rootRecord = records.get(rootModule);
    for (const record of records.values()) {
      const moduleName = getModuleName(record.module);
      for (const provider of record.providers) {
        const visibleTokens =
          overriddenTokens.has(provider.provide) && rootRecord
            ? rootRecord.visibleTokens
            : record.visibleTokens;
        for (const dependency of this.getProviderDependencies(provider)) {
          if (!visibleTokens.has(dependency)) {
            throw new UnresolvedProviderDependencyError(
              moduleName,
              provider.provide,
              dependency,
            );
          }
        }
      }
    }
  }

  private populateVisibleAndExportedTokens(
    record: ModuleRecord,
    records: ReadonlyMap<DependencyModule, ModuleRecord>,
  ): void {
    for (const importedModule of record.imports) {
      const importedRecord = records.get(importedModule);
      if (!importedRecord) {
        continue;
      }
      this.populateVisibleAndExportedTokens(importedRecord, records);
      for (const token of importedRecord.exportedTokens) {
        record.visibleTokens.add(token);
      }
    }

    const validExportTokens = new Set(record.localTokens);
    for (const importedModule of record.imports) {
      const importedRecord = records.get(importedModule);
      if (!importedRecord) {
        continue;
      }
      for (const token of importedRecord.exportedTokens) {
        validExportTokens.add(token);
      }
    }

    for (const token of record.exports) {
      if (!validExportTokens.has(token)) {
        throw new InvalidModuleExportError(getModuleName(record.module), token);
      }
      record.exportedTokens.add(token);
    }
  }

  private validateProviderCycles(): void {
    const visiting = new Set<symbol>();
    const visited = new Set<symbol>();

    const visit = (token: symbol, path: readonly symbol[]): void => {
      if (visited.has(token)) {
        return;
      }
      if (visiting.has(token)) {
        throw new CircularProviderError([
          ...path.slice(path.indexOf(token)),
          token,
        ]);
      }

      const provider = this.providers.get(token);
      if (!provider) {
        return;
      }

      visiting.add(token);
      for (const dependency of this.getProviderDependencies(provider)) {
        visit(dependency, [...path, token]);
      }
      visiting.delete(token);
      visited.add(token);
    };

    for (const token of this.providers.keys()) {
      visit(token, []);
    }
  }

  private getProviderDependencies(provider: Provider): readonly symbol[] {
    if (isFactoryProvider(provider)) {
      return provider.inject;
    }
    if (isExistingProvider(provider)) {
      return [provider.useExisting];
    }
    return [];
  }

  private resolveExistingProvider<T>(provider: ExistingProvider<T>): T {
    return this.resolveProvider(provider.useExisting);
  }
}
