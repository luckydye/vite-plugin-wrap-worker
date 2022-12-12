import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "lib",
    lib: {
      entry: "wrap-worker.ts",
      formats: ["cjs"],
    },
    emptyOutDir: true,
  },
});
