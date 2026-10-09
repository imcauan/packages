import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'nestjs/index': 'src/nestjs/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
