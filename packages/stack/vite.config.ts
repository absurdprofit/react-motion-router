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
    include: ['src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    browser: {
      provider: 'playwright', // or 'webdriverio'
      enabled: true,
      headless: process.argv.includes('--run'),
      instances: [
        { browser: 'chromium' },
      ],
    },
    typecheck: {
      tsconfig: resolve(__dirname, 'tsconfig.json'),
      enabled: true,
      ignoreSourceErrors: false,
      checker: 'tsc',
      include: [
        'src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
    },
  },
  optimizeDeps: {
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
      external: [
        'react',
        'react/jsx-runtime',
        '@react-motion-router/core',
        'web-animations-extension',
      ],
      output: {
        entryFileNames: '[name].js',
        dir: 'build',
      },
    },
  },
});