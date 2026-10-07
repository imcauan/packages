/**
 * Coverage exclusions that hold for any project: test files, declarations and
 * mock folders. Add your own naming conventions on top:
 * `exclude: [...commonCoverageExcludes, '**\/*.generated.ts']`.
 */
export const commonCoverageExcludes = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/*.d.ts',
  '**/mocks/**',
  '**/__mocks__/**',
  '**/__tests__/**',
  'node_modules',
];
