# Security

Pixel Pomodoro is a small offline desktop app. This document describes its
actual attack surface, based on the code in this repository — not a generic
policy template.

## What it touches

| Path | Access | Written by |
|------|--------|-----------|
| `~/Library/Application Support/Pixel Pomodoro/pomodoro-data.json` (macOS) or `%APPDATA%\Pixel Pomodoro\pomodoro-data.json` (Windows) | read + write | The app's main process only |
| Standard Chromium/Electron runtime files in that same folder (caches, GPU state, etc.) | read + write | The Electron framework itself, not app code |

That is the complete list. `pomodoro-data.json` contains your configured
durations, volume/mute, window position, and a per-day count of completed
pomodoros (pruned to the last 30 days). It is written atomically (temp file +
rename), so a crash or power loss cannot leave it half-written.

Beyond the filesystem, the app shows native macOS notifications (marked
silent) and plays a bundled WAV chime through your speakers. It never reads
notifications, only posts its own.

## What it never touches

- **Network.** There is no network code anywhere in the app. On top of that,
  the production build enforces a Content-Security-Policy with
  `connect-src 'none'`, all navigation away from the bundled UI is blocked,
  every `window.open()` is denied, and `<webview>` attachment is prevented.
  Even if a bug let hostile code into the renderer, it would have no way to
  send anything out.
- **Auto-update.** Deliberately left out: an updater would require the app to
  phone home on every launch. The app could have shipped with one and chooses
  not to — updates are manual, via [GitHub Releases](https://github.com/malenitaa/pomodoro/releases).
- **Your files.** No file dialogs, no reading outside its own data file.
- **Credentials, Keychain, clipboard, microphone, camera.** Never accessed.
- **Telemetry or analytics.** None, first-party or third-party. The runtime
  dependencies are exactly React, ReactDOM, and a bundled pixel font.

## Untrusted input

This app accepts almost no input, and everything it does accept is validated:

- **IPC from the renderer.** The renderer runs sandboxed with context
  isolation; the preload script exposes only a fixed set of named functions,
  each bound to exactly one IPC channel — there is no generic
  `invoke(channel, ...)` passthrough. Every settings payload crossing that
  boundary is checked in `electron/validators.js` against an allowlist of
  known keys with type and range rules; unknown keys or out-of-range values
  reject the whole payload rather than being coerced.
- **The data file on disk.** Treated as untrusted at load: `sanitizeData()`
  keeps only known keys of the expected types, day keys must match
  `YYYY-MM-DD`, counts must be non-negative integers, and a corrupt or
  missing file silently falls back to defaults instead of crashing.
- **No text fields.** The UI has numeric steppers and toggles only — there is
  nowhere for a user (or anything else) to enter free text.

### Warnings for future editors

- Adding a settings field requires updating **both** `electron/validators.js`
  (or the update will be rejected) and the defaults in `electron/store.js`
  (or the value will be stripped on the next load). Skipping either one fails
  quietly.
- `electron/main.js` contains a **relaxed dev-only CSP** so Vite's
  hot-reload works against `localhost:5173`. It is gated on
  `NODE_ENV === "development"` and never ships in the packaged app — keep it
  that way.

## What is less tested

- The **Intel (x64)** `.dmg` is produced by the same CI as the Apple Silicon
  one, but the app is developed and manually tested on Apple Silicon.
- The **Windows** installer is newer than the macOS one and gets less manual
  testing (the app is developed on a Mac). Same code, same no-network
  guarantees — but if something platform-specific breaks, it's more likely
  there.
- There is no **Linux** build.

## Reporting

Found something? Open an issue on
[GitHub Issues](https://github.com/malenitaa/pomodoro/issues). There is no
sensitive data at stake in this app, so public issues are fine.
