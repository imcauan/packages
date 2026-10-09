import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'axios/index': 'src/axios/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
