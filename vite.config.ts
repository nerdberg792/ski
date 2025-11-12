import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "src/main/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              output: {
                entryFileNames: "main.cjs",
                format: "cjs",
              },
            },
          },
        },
      },
      preload: {
        input: {
          preload: "src/preload/index.ts",
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              output: {
                entryFileNames: "preload.cjs",
                format: "cjs",
              },
            },
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
  root: ".",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist/renderer",
  },
});

