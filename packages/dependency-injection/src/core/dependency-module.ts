import type { Provider } from './provider.js';
import type { InjectionToken } from './injection-token.js';

/**
 * Class used only as a module metadata target.
 *
 * Modules are never instantiated by the DI package.
 */
export type ModuleType = abstract new (...args: never[]) => unknown;

/**
 * Declarative module metadata.
 *
 * `imports` exposes exported tokens from other modules to this module.
 * `providers` declares this module's local providers.
 * `exports` publishes local or re-exported tokens to importing modules.
 */
export type ModuleMetadata = {
  imports?: readonly ModuleType[];
  providers?: readonly Provider[];
  exports?: readonly InjectionToken<unknown>[];
};

export type DependencyModule = ModuleType;

type StoredModuleMetadata = Required<ModuleMetadata> & {
  name?: string;
};

const moduleMetadata = new WeakMap<ModuleType, StoredModuleMetadata>();

/**
 * Declares dependency metadata for a module class.
 *
 * The decorator records metadata in a package-local `WeakMap`. It does not use
 * `reflect-metadata`, constructor parameter metadata, or class instantiation.
 */
export function Module(metadata: ModuleMetadata): (target: ModuleType) => void {
  return target => {
    moduleMetadata.set(target, normalizeModuleMetadata(metadata));
  };
}

/** @internal */
export function getModuleMetadata(module: ModuleType): StoredModuleMetadata {
  const metadata = moduleMetadata.get(module);
  if (!metadata) {
    throw new Error(`${getModuleName(module)} is not a dependency module`);
  }
  return metadata;
}

/** @internal */
export function hasModuleMetadata(module: ModuleType): boolean {
  return moduleMetadata.has(module);
}

/** @internal */
export function getModuleName(module: ModuleType): string {
  return moduleMetadata.get(module)?.name ?? module.name;
}

/**
 * Creates a module class from object metadata.
 *
 * @deprecated Prefer `@Module()` classes for application modules. This helper
 * remains for compatibility and small migration tests.
 */
export function defineModule(
  module: ModuleMetadata & { name: string },
): ModuleType {
  abstract class DefinedDependencyModule {}
  moduleMetadata.set(DefinedDependencyModule, {
    ...normalizeModuleMetadata(module),
    name: module.name,
  });
  return DefinedDependencyModule;
}

function normalizeModuleMetadata(
  metadata: ModuleMetadata,
): StoredModuleMetadata {
  return Object.freeze({
    imports: Object.freeze([...(metadata.imports ?? [])]),
    providers: Object.freeze([...(metadata.providers ?? [])]),
    exports: Object.freeze([...(metadata.exports ?? [])]),
  });
}
