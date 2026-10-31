import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'build'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/wpt-inject.ts'),
      name: 'NavigationApiWpt',
      formats: ['iife'],
      fileName: () => 'wpt-inject.js',
    },
    target: 'es2022',
    minify: true,
    sourcemap: false,
  },
});
