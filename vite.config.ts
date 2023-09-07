import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    outDir: "lib",
    lib: {
      entry: "wrap-worker.ts",
      formats: ["cjs"],
    },
    emptyOutDir: true,
    rollupOptions: {
      external: ["node:crypto", "node:path"],
    },
  },
});
