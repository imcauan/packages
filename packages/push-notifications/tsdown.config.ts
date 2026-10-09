import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'browser/index': 'src/browser/index.ts',
    'web-push/index': 'src/web-push/index.ts',
    'nestjs/index': 'src/nestjs/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
