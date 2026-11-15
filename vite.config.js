import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production Content-Security-Policy. The packaged app loads dist/index.html
// over file://, where Electron's webRequest.onHeadersReceived never fires,
// so a response header can't carry it: it has to be a <meta> tag in the
// built HTML. scripts/verify-security.mjs checks it's there and enforced.
// (font-src allows data: because Vite inlines the smallest font subsets.)
const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
].join("; ");

// Build only: the dev server needs an inline React-refresh preamble and an
// HMR WebSocket, so `npm run dev` gets the relaxed policy that
// electron/main.js sets as a header instead.
function productionCsp() {
  return {
    name: "production-csp",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: PROD_CSP },
        injectTo: "head-prepend",
      },
    ],
  };
}

// Renderer bundle only. Electron's main/preload processes are plain
// CommonJS files run directly by Electron (see electron/), not bundled.
export default defineConfig({
  base: "./",
  plugins: [react(), productionCsp()],
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
