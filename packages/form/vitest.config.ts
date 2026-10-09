import {
  defineSharedVitestConfig,
  unitIntegrationTestTypes,
} from '@imcauan/vitest-config';

// React specs opt into jsdom with a `@vitest-environment jsdom` comment.
export default defineSharedVitestConfig({
  rootDir: import.meta.dirname,
  testType: unitIntegrationTestTypes,
  test: {
    environment: 'node',
    include: ['tests/**/*.{spec,test}.{ts,tsx}'],
  },
});
