import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ outDir: 'build' })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    },
    target: 'ES2022',
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', '@virtualstate/navigation', 'urlpattern-polyfill'],
      output: {
        entryFileNames: '[name].js',
        dir: 'build',
      }
    }
  }
});