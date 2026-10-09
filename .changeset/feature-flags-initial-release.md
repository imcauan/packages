---
'@imcauan/feature-flags': minor
---

Add the `@imcauan/feature-flags` package: the `IFeatureFlagProvider` port with a no-op default, and `@imcauan/feature-flags/nestjs` with `RequireFeatureFlag` and `FeatureFlagGuard`, which answers 404 when a route's flag is off.
