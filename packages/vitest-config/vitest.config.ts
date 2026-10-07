import { defineConfig } from 'vitest/config';

// Plain config: testing this package through itself could hide its own bugs
// (docs/TESTING.md#bootstrapping).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.{spec,test}.ts'],
  },
});
