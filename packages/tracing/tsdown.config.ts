import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    register: 'src/register.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
