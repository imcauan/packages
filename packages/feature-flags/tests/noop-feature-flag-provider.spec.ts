import { NoopFeatureFlagProvider } from '../src';

const makeSut = (): NoopFeatureFlagProvider => new NoopFeatureFlagProvider();

describe('NoopFeatureFlagProvider', () => {
  describe('isEnabled', () => {
    it('should resolve false for any key', async () => {
      const sut = makeSut();

      const enabled = await sut.isEnabled('any-flag');

      expect(enabled).toBe(false);
    });
  });
});
