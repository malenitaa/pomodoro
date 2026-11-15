"use strict";

const path = require("path");
const { app, BrowserWindow, session, Notification, ipcMain, Menu } = require("electron");

const store = require("./store");
const { createTimer } = require("./timer");
const { validateSettingsPatch, validateBoolean } = require("./validators");
const { resolveLanguage, notificationStrings } = require("./i18n");

// Dev mode only when running from the source tree (`npm run dev`). An env
// variable isn't enough: a packaged app launched with NODE_ENV=development
// would otherwise load http://localhost:5173 with the preload bridge.
const isDev = !app.isPackaged;

// Windows groups notifications by AppUserModelID; without this they show as
// coming from "electron.app.Electron" (or not at all in a packaged build).
if (process.platform === "win32") {
  app.setAppUserModelId("com.malenitaa.pixelpomodoro");
}

let mainWindow = null;
let data = store.loadData();
let saveTimeout = null;

// Never let a filesystem error (disk full, permissions, ...) crash the
// whole main process or bubble a raw Node error — with its absolute file
// paths — anywhere near the renderer. Worst case, that one save is lost;
// the app keeps running and will just try again on the next change.
function safeSaveData(nextData) {
  try {
    return store.saveData(nextData);
  } catch (err) {
    console.error("No se pudo guardar pomodoro-data.json:", err.message);
    return nextData;
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    data = safeSaveData(data);
    saveTimeout = null;
  }, 300);
}

function getSettings() {
  return data.settings;
}

function incrementTodayCount() {
  const key = store.todayKey();
  const byDay = { ...data.stats.byDay };
  byDay[key] = (byDay[key] || 0) + 1;
  data = { ...data, stats: { byDay: store.pruneStats(byDay) } };
  scheduleSave();
}

function todayCount() {
  return data.stats.byDay[store.todayKey()] || 0;
}

function broadcast(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

const timer = createTimer({
  getSettings,
  onTick: (state) => broadcast("timer:state", { ...state, todayCount: todayCount() }),
  onBlockComplete: ({ finishedPhase, nextPhase, pomodoroCount }) => {
    if (finishedPhase === "focus") {
      incrementTodayCount();
    }
    broadcast("timer:blockComplete", { finishedPhase, nextPhase, pomodoroCount });

    if (Notification.isSupported()) {
      const t = notificationStrings(resolveLanguage(data.settings.language, () => app.getLocale()));
      const title = finishedPhase === "focus" ? t.focusDone : t.breakDone;
      const body =
        nextPhase === "focus" ? t.backToFocus : nextPhase === "longBreak" ? t.takeLongBreak : t.takeShortBreak;
      new Notification({ title, body, silent: true }).show();
    }
  },
});

function createWindow() {
  const bounds = data.settings.windowBounds || {};
  mainWindow = new BrowserWindow({
    width: bounds.width || 320,
    height: bounds.height || 420,
    x: typeof bounds.x === "number" ? bounds.x : undefined,
    y: typeof bounds.y === "number" ? bounds.y : undefined,
    minWidth: 300,
    minHeight: 400,
    frame: false,
    resizable: true,
    alwaysOnTop: Boolean(data.settings.alwaysOnTop),
    backgroundColor: "#1a1230",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // In production, strip Electron's default menu (Reload, Force Reload,
  // Toggle Developer Tools, ...) and refuse to open DevTools even if
  // something tries to. There's nothing sensitive in this app's console,
  // but there's no reason to expose internals or a debugging surface in
  // a packaged build either. Left intact in dev for normal debugging.
  if (!isDev) {
    Menu.setApplicationMenu(null);
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Block all external navigation — this app never navigates away from its
  // own bundled UI.
  mainWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  // Deny every window.open()/target=_blank attempt instead of opening a new
  // BrowserWindow or shell-opening the URL.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  let boundsSaveTimeout = null;
  const persistBounds = () => {
    if (boundsSaveTimeout) clearTimeout(boundsSaveTimeout);
    boundsSaveTimeout = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const [width, height] = mainWindow.getSize();
      const [x, y] = mainWindow.getPosition();
      data = {
        ...data,
        settings: { ...data.settings, windowBounds: { x, y, width, height } },
      };
      scheduleSave();
    }, 400);
  };
  mainWindow.on("move", persistBounds);
  mainWindow.on("resize", persistBounds);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Dev only. The packaged app's strict CSP (connect-src 'none') is a <meta>
// tag that vite.config.js injects into dist/index.html at build time:
// loadFile() serves it over file://, where onHeadersReceived never fires.
// `npm run dev` loads Vite's dev server over http instead, which needs an
// inline bootstrap script and a WebSocket back to itself for hot reload —
// this relaxed policy only ever applies to that local dev server.
function applyDevCsp() {
  const devCsp = [
    "default-src 'self' http://localhost:5173",
    "script-src 'self' 'unsafe-inline' http://localhost:5173",
    "style-src 'self' 'unsafe-inline' http://localhost:5173",
    "img-src 'self' data: http://localhost:5173",
    "connect-src 'self' ws://localhost:5173 http://localhost:5173",
    "object-src 'none'",
    "frame-src 'none'",
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [devCsp],
      },
    });
  });
}

function registerIpcHandlers() {
  ipcMain.handle("timer:start", () => timer.start());
  ipcMain.handle("timer:pause", () => timer.pause());
  ipcMain.handle("timer:reset", () => timer.reset());
  ipcMain.handle("timer:skip", () => timer.skip());
  ipcMain.handle("timer:getState", () => ({ ...timer.getState(), todayCount: todayCount() }));

  ipcMain.handle("settings:get", () => data.settings);
  ipcMain.handle("settings:update", (_event, payload) => {
    const patch = validateSettingsPatch(payload);
    data = { ...data, settings: { ...data.settings, ...patch } };
    scheduleSave();
    if (mainWindow && !mainWindow.isDestroyed() && Object.prototype.hasOwnProperty.call(patch, "alwaysOnTop")) {
      mainWindow.setAlwaysOnTop(Boolean(patch.alwaysOnTop));
    }
    timer.applySettingsChange();
    return data.settings;
  });

  ipcMain.handle("stats:get", () => ({ byDay: data.stats.byDay, todayCount: todayCount() }));

  ipcMain.handle("window:minimize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
  });
  ipcMain.handle("window:close", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });
  ipcMain.handle("window:setAlwaysOnTop", (_event, value) => {
    const flag = validateBoolean(value, "alwaysOnTop");
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(flag);
    data = { ...data, settings: { ...data.settings, alwaysOnTop: flag } };
    scheduleSave();
    return flag;
  });
}

app.whenReady().then(() => {
  if (isDev) applyDevCsp();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    data = safeSaveData(data);
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    data = safeSaveData(data);
  }
});

// Defense in depth: never allow this process to create additional windows
// or attach webviews from renderer content.
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => event.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
});
