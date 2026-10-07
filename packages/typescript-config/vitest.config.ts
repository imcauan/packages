import { defineConfig } from 'vitest/config';

// Plain config: this package is built before @imcauan/vitest-config exists.
export default defineConfig({
  test: {
    include: ['tests/**/*.{spec,test}.ts'],
  },
});
