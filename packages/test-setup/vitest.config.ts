import { defineConfig } from 'vitest/config';

// Plain config: @imcauan/vitest-config depends on this package, so it can't
// be used here (docs/TESTING.md#bootstrapping).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.{spec,test}.ts'],
  },
});
