import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
