/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import postcssNesting from 'postcss-nesting';
import svgr from 'vite-plugin-svgr';
import license from 'rollup-plugin-license';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

const upperDiff = "𝗔".codePointAt(0)! - "A".codePointAt(0)!;
const lowerDiff = "𝗮".codePointAt(0)! - "a".codePointAt(0)!;

const isUpper = (n: number) => n >= 65 && n < 91;
const isLower = (n: number) => n >= 97 && n < 123;

const bolderize = (char: string) => {
  const n = char.charCodeAt(0);
  if (isUpper(n)) return String.fromCodePoint(n + upperDiff);
  if (isLower(n)) return String.fromCodePoint(n + lowerDiff);
  return char;
};

const bold = (word: string) => [...Array.from(word)].map(bolderize).join("");

export default defineConfig({
  cacheDir: '../../node_modules/.vite/example',
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.JPG'],
  plugins: [react(), viteTsconfigPaths(), svgr()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer,
        postcssNesting
      ]
    }
  },
  server: {
    open: true,
    port: 3000,
  },
  build: {
    target: 'ES2022',
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            output: {
              file: path.resolve(__dirname, 'build', 'assets', 'LICENSE.txt'),
              template(dependencies) {
                return dependencies.map((dependency) => {
                  return `${bold(dependency.name?.toUpperCase() ?? "")}\n\n${dependency.licenseText ?? ""}`;
                }).join('\n\n\n');
              }
            }
          }
        })
      ]
    }
  },
  esbuild: {
    banner: '/* LICENSES */',
    legalComments: 'none',
    sourcemap: true,
  },
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  }
});