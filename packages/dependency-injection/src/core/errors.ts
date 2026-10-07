export class DependencyInjectionError extends Error {}

function describeToken(token: symbol): string {
  return token.description ?? 'anonymous token';
}

export class MissingProviderError extends DependencyInjectionError {
  constructor(token: symbol) {
    super(`Provider not found: ${describeToken(token)}`);
    this.name = 'MissingProviderError';
  }
}

export class DuplicateProviderError extends DependencyInjectionError {
  constructor(token: symbol) {
    super(`Provider already registered: ${describeToken(token)}`);
    this.name = 'DuplicateProviderError';
  }
}

export class CircularProviderError extends DependencyInjectionError {
  constructor(tokenOrPath: symbol | readonly symbol[]) {
    const path =
      typeof tokenOrPath === 'symbol'
        ? describeToken(tokenOrPath)
        : tokenOrPath.map(describeToken).join(' -> ');
    super(`Circular provider dependency: ${path}`);
    this.name = 'CircularProviderError';
  }
}

export class CircularModuleError extends DependencyInjectionError {
  constructor(moduleNameOrPath: string | readonly string[]) {
    const path = Array.isArray(moduleNameOrPath)
      ? moduleNameOrPath.join(' -> ')
      : String(moduleNameOrPath);
    super(`Circular module import: ${path}`);
    this.name = 'CircularModuleError';
  }
}

export class InvalidModuleError extends DependencyInjectionError {
  constructor(moduleName: string) {
    super(`${moduleName} is not a dependency module`);
    this.name = 'InvalidModuleError';
  }
}

export class InvalidModuleExportError extends DependencyInjectionError {
  constructor(moduleName: string, token: symbol) {
    super(
      `${moduleName} cannot export ${describeToken(token)} because it is not provided locally or exported by an imported module`,
    );
    this.name = 'InvalidModuleExportError';
  }
}

export class UnresolvedProviderDependencyError extends DependencyInjectionError {
  constructor(moduleName: string, provider: symbol, dependency: symbol) {
    super(
      `${moduleName} provider ${describeToken(provider)} cannot inject ${describeToken(dependency)} because the dependency is not visible to the module`,
    );
    this.name = 'UnresolvedProviderDependencyError';
  }
}
