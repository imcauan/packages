import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'vitest/index': 'src/vitest/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
