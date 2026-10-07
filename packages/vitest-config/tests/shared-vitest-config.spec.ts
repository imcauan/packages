import path from 'node:path';

import { TestTypeReporter } from '@imcauan/test-setup/vitest';

import { defineSharedVitestConfig, unitIntegrationTestTypes } from '../src';

const makeSut = (): typeof defineSharedVitestConfig => defineSharedVitestConfig;

describe('defineSharedVitestConfig', () => {
  describe('test defaults', () => {
    it('should enable globals, run files serially and allow 10 seconds per test', () => {
      const sut = makeSut();

      const config = sut({ rootDir: '/any/root' });

      expect(config.test).toEqual({
        globals: true,
        fileParallelism: false,
        testTimeout: 10000,
      });
    });

    it('should let test options override the defaults', () => {
      const sut = makeSut();

      const config = sut({
        rootDir: '/any/root',
        test: { testTimeout: 1000, environment: 'jsdom' },
      });

      expect(config.test).toMatchObject({
        testTimeout: 1000,
        environment: 'jsdom',
      });
    });
  });

  describe('reporters', () => {
    it('should use a test-type reporter when a test type is given', () => {
      const sut = makeSut();

      const config = sut({
        rootDir: '/any/root',
        testType: unitIntegrationTestTypes,
      });

      expect(config.test?.reporters).toEqual([expect.any(TestTypeReporter)]);
    });

    it('should keep the given reporters when no test type is given', () => {
      const sut = makeSut();

      const config = sut({
        rootDir: '/any/root',
        test: { reporters: ['dot'] },
      });

      expect(config.test?.reporters).toEqual(['dot']);
    });

    it('should prefer the test-type reporter over the given reporters', () => {
      const sut = makeSut();

      const config = sut({
        rootDir: '/any/root',
        test: { reporters: ['dot'] },
        testType: unitIntegrationTestTypes,
      });

      expect(config.test?.reporters).toEqual([expect.any(TestTypeReporter)]);
    });
  });

  it('should resolve aliases against the root directory', () => {
    const sut = makeSut();

    const config = sut({ rootDir: '/any/root', aliases: { '@': 'src' } });

    expect(config.resolve).toEqual({
      alias: { '@': path.resolve('/any/root', 'src') },
    });
  });

  it('should pass other Vite options through', () => {
    const sut = makeSut();

    const config = sut({ rootDir: '/any/root', cacheDir: 'any-cache-dir' });

    expect(config.cacheDir).toBe('any-cache-dir');
  });
});
