import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Renderer bundle only. Electron's main/preload processes are plain
// CommonJS files run directly by Electron (see electron/), not bundled.
export default defineConfig({
  base: "./",
  plugins: [react()],
  assetsInclude: ["**/*.wav"],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
