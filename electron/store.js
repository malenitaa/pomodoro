"use strict";

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DATA_FILE_NAME = "pomodoro-data.json";
const STATS_RETENTION_DAYS = 30;

function defaultSettings() {
  return {
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    pomodorosBeforeLongBreak: 4,
    volume: 0.7,
    muted: false,
    alwaysOnTop: false,
    windowBounds: { x: null, y: null, width: 320, height: 420 },
  };
}

function defaultData() {
  return {
    settings: defaultSettings(),
    stats: { byDay: {} },
  };
}

function dataFilePath() {
  return path.join(app.getPath("userData"), DATA_FILE_NAME);
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Keep only the most recent STATS_RETENTION_DAYS day keys, discarding the rest.
function pruneStats(byDay) {
  const keys = Object.keys(byDay).sort();
  const pruned = {};
  for (const key of keys.slice(-STATS_RETENTION_DAYS)) {
    pruned[key] = byDay[key];
  }
  return pruned;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Merge unknown/possibly-corrupt parsed JSON onto defaults, keeping only
// known keys with the expected types. Anything else falls back silently.
function sanitizeData(parsed) {
  const defaults = defaultData();
  if (!isPlainObject(parsed)) return defaults;

  const settings = { ...defaults.settings };
  if (isPlainObject(parsed.settings)) {
    for (const key of Object.keys(defaults.settings)) {
      const value = parsed.settings[key];
      if (key === "windowBounds") {
        if (isPlainObject(value)) {
          settings.windowBounds = {
            x: typeof value.x === "number" ? value.x : null,
            y: typeof value.y === "number" ? value.y : null,
            width: typeof value.width === "number" ? value.width : defaults.settings.windowBounds.width,
            height: typeof value.height === "number" ? value.height : defaults.settings.windowBounds.height,
          };
        }
        continue;
      }
      if (typeof value === typeof defaults.settings[key]) {
        settings[key] = value;
      }
    }
  }

  const byDay = {};
  if (isPlainObject(parsed.stats) && isPlainObject(parsed.stats.byDay)) {
    for (const [key, value] of Object.entries(parsed.stats.byDay)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isInteger(value) && value >= 0) {
        byDay[key] = value;
      }
    }
  }

  return { settings, stats: { byDay: pruneStats(byDay) } };
}

function loadData() {
  const filePath = dataFilePath();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return sanitizeData(parsed);
  } catch {
    // Missing or corrupt file: start fresh with defaults instead of crashing.
    return defaultData();
  }
}

// Atomic write: write to a temp file in the same directory, then rename
// over the target. Rename is atomic on the same filesystem, so a crash or
// power loss mid-write can never leave a half-written data file behind.
function saveData(data) {
  const filePath = dataFilePath();
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  const sanitized = sanitizeData(data);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmpPath, JSON.stringify(sanitized, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
  return sanitized;
}

module.exports = {
  defaultSettings,
  defaultData,
  todayKey,
  pruneStats,
  sanitizeData,
  loadData,
  saveData,
};
