import {
  TestTypeReporter,
  type TestTypeReporterOptions,
} from '@imcauan/test-setup/vitest';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

import { resolveWorkspaceAliases, type WorkspaceAliasMap } from './aliases';

export type SharedVitestConfigOptions = Omit<
  ViteUserConfig,
  'resolve' | 'test'
> & {
  rootDir: string;
  aliases?: WorkspaceAliasMap;
  test?: ViteUserConfig['test'];
  testType?: TestTypeReporterOptions;
};

export function defineSharedVitestConfig({
  rootDir,
  aliases,
  test,
  testType,
  ...config
}: SharedVitestConfigOptions) {
  const reporters = testType
    ? [new TestTypeReporter(testType)]
    : test?.reporters;

  return defineConfig({
    ...config,
    test: {
      globals: true,
      fileParallelism: false,
      testTimeout: 10000,
      ...test,
      ...(reporters ? { reporters } : {}),
    },
    resolve: {
      alias: resolveWorkspaceAliases(rootDir, aliases),
    },
  });
}
