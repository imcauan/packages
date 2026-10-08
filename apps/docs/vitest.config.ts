import {
  defineSharedVitestConfig,
  unitIntegrationTestTypes,
} from '@imcauan/vitest-config';

export default defineSharedVitestConfig({
  rootDir: import.meta.dirname,
  testType: unitIntegrationTestTypes,
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
});
