"use strict";

const path = require("path");
const { app, BrowserWindow, session, Notification, ipcMain } = require("electron");

const store = require("./store");
const { createTimer } = require("./timer");
const { validateSettingsPatch, validateBoolean } = require("./validators");

const isDev = process.env.NODE_ENV === "development";

// Electron flags that reduce attack surface / disable features this app
// never needs (no GPU-accelerated remote content, no experimental APIs).
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

let mainWindow = null;
let data = store.loadData();
let saveTimeout = null;

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    data = store.saveData(data);
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
      const title = finishedPhase === "focus" ? "¡Bloque de foco terminado!" : "¡Descanso terminado!";
      const body =
        nextPhase === "focus"
          ? "Hora de volver al foco."
          : nextPhase === "longBreak"
          ? "Tomate un descanso largo."
          : "Tomate un descanso corto.";
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

function applyStrictCsp() {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
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
  applyStrictCsp();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    data = store.saveData(data);
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    data = store.saveData(data);
  }
});

// Defense in depth: never allow this process to create additional windows
// or attach webviews from renderer content.
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => event.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
});
