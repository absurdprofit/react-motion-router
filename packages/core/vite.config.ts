import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ outDir: 'build' }),
  ],
  test: {
    globals: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    browser: {
      provider: 'playwright', // or 'webdriverio'
      enabled: true,
      name: 'chromium', // browser name is required
      headless: process.argv.includes('--run'),
    },
  },
  optimizeDeps: {
    include: ['@virtualstate/navigation'],
    esbuildOptions: {
      supported: {
        'top-level-await': true,
      },
    },
  },
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
      },
    },
  },
});