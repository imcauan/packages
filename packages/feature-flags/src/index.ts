/** Answers whether a feature flag is on. Implement it over your flag store. */
export interface IFeatureFlagProvider {
  isEnabled(key: string): Promise<boolean>;
}

/** Injection token for an `IFeatureFlagProvider`. */
export const FeatureFlagProvider = Symbol('FeatureFlagProvider');

/**
 * An `IFeatureFlagProvider` with every flag off, for apps or tests that have
 * no flag store yet. It never throws, so gated features fail closed.
 */
export class NoopFeatureFlagProvider implements IFeatureFlagProvider {
  async isEnabled(_key: string): Promise<boolean> {
    return false;
  }
}
