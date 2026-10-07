import { describe, expect, it } from 'vitest';

import { commonCoverageExcludes } from '../src';

const makeSut = (): readonly string[] => commonCoverageExcludes;

describe('commonCoverageExcludes', () => {
  it('should exclude only test files, declarations, mocks and node_modules', () => {
    const sut = makeSut();

    expect(sut).toEqual([
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/*.d.ts',
      '**/mocks/**',
      '**/__mocks__/**',
      '**/__tests__/**',
      'node_modules',
    ]);
  });
});
