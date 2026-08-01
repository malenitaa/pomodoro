"use strict";

// This runs in a sandboxed, isolated context (contextIsolation: true,
// sandbox: true). It never exposes ipcRenderer itself, and never exposes a
// generic invoke(channel, ...args) passthrough — only a fixed set of named
// functions, each bound to exactly one IPC channel. The renderer cannot
// call arbitrary main-process IPC handlers, only these.

const { contextBridge, ipcRenderer } = require("electron");

const STATE_CHANNEL = "timer:state";
const BLOCK_COMPLETE_CHANNEL = "timer:blockComplete";

function subscribe(channel, callback) {
  if (typeof callback !== "function") return () => {};
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld("pomodoro", {
  timer: {
    start: () => ipcRenderer.invoke("timer:start"),
    pause: () => ipcRenderer.invoke("timer:pause"),
    reset: () => ipcRenderer.invoke("timer:reset"),
    skip: () => ipcRenderer.invoke("timer:skip"),
    getState: () => ipcRenderer.invoke("timer:getState"),
    onState: (callback) => subscribe(STATE_CHANNEL, callback),
    onBlockComplete: (callback) => subscribe(BLOCK_COMPLETE_CHANNEL, callback),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (patch) => ipcRenderer.invoke("settings:update", patch),
  },
  stats: {
    get: () => ipcRenderer.invoke("stats:get"),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    close: () => ipcRenderer.invoke("window:close"),
    setAlwaysOnTop: (value) => ipcRenderer.invoke("window:setAlwaysOnTop", value),
  },
});
