import dts from "vite-plugin-dts";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true, outDir: 'build' })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        dir: 'build',
      }
    },
  },
});