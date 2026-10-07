import { describe, expect, it } from 'vitest';

import {
  apiIntegrationTestTypes,
  browserTestType,
  integrationTestType,
  unitIntegrationTestTypes,
} from '../src';
import type { TestTypeReporterOptions } from '@imcauan/test-setup/vitest';

/** Resolves a file's label the way TestTypeReporter does. */
const makeSut =
  () =>
  (preset: TestTypeReporterOptions, file: string): string =>
    (
      preset.labels?.find(({ pattern }) => pattern.test(file)) ??
      preset.defaultLabel
    ).label;

describe('test type presets', () => {
  describe('unitIntegrationTestTypes', () => {
    it.each([
      ['any-file.spec.ts', 'unit'],
      ['any-file.spec.tsx', 'unit'],
      ['any-file.test.ts', 'integration'],
      ['any-file.test.mts', 'integration'],
      ['any-file.ts', 'unit'],
    ])('should label %s as %s', (file, label) => {
      const sut = makeSut();

      const result = sut(unitIntegrationTestTypes, `/any/dir/${file}`);

      expect(result).toBe(label);
    });
  });

  describe('apiIntegrationTestTypes', () => {
    it.each([
      ['any-file.e2e-spec.ts', 'e2e'],
      ['any-file.e2e.spec.ts', 'e2e'],
      ['any-file.test.ts', 'integration'],
      ['any-file.ts', 'integration'],
    ])('should label %s as %s', (file, label) => {
      const sut = makeSut();

      const result = sut(apiIntegrationTestTypes, `/any/dir/${file}`);

      expect(result).toBe(label);
    });
  });

  it('should label every file as browser with browserTestType', () => {
    const sut = makeSut();

    const result = sut(browserTestType, '/any/dir/any-file.test.tsx');

    expect(result).toBe('browser');
  });

  it('should label every file as integration with integrationTestType', () => {
    const sut = makeSut();

    const result = sut(integrationTestType, '/any/dir/any-file.spec.ts');

    expect(result).toBe('integration');
  });
});
