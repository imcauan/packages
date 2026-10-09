import {
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import type { IFeatureFlagProvider } from '..';
import { REQUIRE_FEATURE_FLAG_KEY } from './require-feature-flag.decorator';

/**
 * Lets a request through when its route has no `@RequireFeatureFlag`, or when
 * the flag is on. Otherwise throws `NotFoundException`, so callers without the
 * flag can't tell the route exists.
 *
 * Provide it with a factory (see the README); its constructor takes the flag
 * provider and Nest's `Reflector`.
 */
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly featureFlagProvider: IFeatureFlagProvider,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRE_FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!key) return true;

    if (!(await this.featureFlagProvider.isEnabled(key))) {
      throw new NotFoundException();
    }

    return true;
  }
}
