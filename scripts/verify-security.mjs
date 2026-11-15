// Security check for the BUILT renderer (dist/), adapted from
// study-room-pixel. Loads dist/index.html over file:// — exactly how the
// packaged app loads it — with the real preload, in a hidden window, and
// checks: the CSP is a <meta> tag in the build with connect-src 'none', the
// browser actually enforces it (fetch is blocked), no Node globals leak into
// the renderer, and the preload exposes only the expected named functions.
// Usage: npm run verify:security   (builds first)
import { app, BrowserWindow, session } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const rendererHtml = join(ROOT, "dist/index.html");
const preloadPath = join(ROOT, "electron/preload.js");

if (!existsSync(rendererHtml)) {
  console.error('dist/index.html is missing — run "npm run build:vite" first.');
  process.exit(2);
}

const EXPECTED_API = {
  settings: ["get", "update"],
  stats: ["get"],
  timer: ["getState", "onBlockComplete", "onState", "pause", "reset", "skip", "start"],
  window: ["close", "minimize", "setAlwaysOnTop"],
};

let headersReceivedForFile = false;

const results = [];
function check(label, pass, detail) {
  results.push({ label, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
}

app.whenReady().then(async () => {
  // Only observes; doesn't add a header. Documents why the CSP can't live
  // in a response header for this app.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.url.startsWith("file://")) headersReceivedForFile = true;
    callback({});
  });

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await win.loadFile(rendererHtml);
  await new Promise((resolve) => setTimeout(resolve, 600));

  const dom = await win.webContents.executeJavaScript(`
    (async function () {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      let violation = null;
      document.addEventListener("securitypolicyviolation", (e) => {
        violation = e.effectiveDirective;
      });
      let fetchResult;
      try {
        await fetch("https://example.com/");
        fetchResult = "succeeded";
      } catch (err) {
        fetchResult = "blocked";
      }
      await new Promise((r) => setTimeout(r, 100));
      const api = window.pomodoro
        ? Object.fromEntries(
            Object.keys(window.pomodoro).sort().map((k) => [k, Object.keys(window.pomodoro[k]).sort()])
          )
        : null;
      return {
        metaCsp: meta ? meta.getAttribute("content") : null,
        metaIsFirstInHead: meta ? document.head.firstElementChild === meta : false,
        fetchResult,
        violation,
        hasWindowRequire: typeof window.require !== "undefined",
        hasWindowProcess: typeof window.process !== "undefined",
        hasGlobalRequire: typeof require !== "undefined",
        api,
      };
    })()
  `);

  check(
    "dist/index.html has a CSP <meta> with connect-src 'none'",
    typeof dom.metaCsp === "string" && dom.metaCsp.includes("connect-src 'none'"),
    dom.metaCsp ?? "no CSP meta tag"
  );
  check("the CSP <meta> is the first element in <head>", dom.metaIsFirstInHead);
  check(
    "fetch() to an external URL is blocked by the CSP",
    dom.fetchResult === "blocked" && dom.violation === "connect-src",
    `fetch ${dom.fetchResult}, violated directive: ${dom.violation}`
  );
  check("window.require is undefined (nodeIntegration off)", dom.hasWindowRequire === false);
  check("window.process is not exposed to the renderer", dom.hasWindowProcess === false);
  check("no global require in the renderer", dom.hasGlobalRequire === false);
  check(
    "preload exposes only the expected named functions (no raw ipcRenderer)",
    JSON.stringify(dom.api) === JSON.stringify(EXPECTED_API),
    `window.pomodoro = ${JSON.stringify(dom.api)}`
  );
  console.log(
    `ℹ️  webRequest.onHeadersReceived fired for file://: ${headersReceivedForFile} (why the CSP is a <meta>)`
  );

  const allPassed = results.every((r) => r.pass);
  console.log(allPassed ? "\nAll security checks passed ✅" : "\nSome security checks failed ❌");

  win.destroy();
  app.exit(allPassed ? 0 : 1);
});
