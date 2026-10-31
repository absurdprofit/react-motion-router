import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ outDir: 'build' }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    target: 'ES2022',
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: '[name].js',
        dir: 'build',
      },
    },
  },
});
