import { SetMetadata } from '@nestjs/common';

/** Metadata key `RequireFeatureFlag` stores the flag key under. */
export const REQUIRE_FEATURE_FLAG_KEY = 'requireFeatureFlag';

/** Gates a route, or every route of a controller, behind a feature flag. */
export const RequireFeatureFlag = (
  key: string,
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_FEATURE_FLAG_KEY, key);
