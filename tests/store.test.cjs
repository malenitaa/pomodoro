"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// electron/store.js expects Electron's `app.getPath('userData')`. Under the
// plain Node test runner there is no Electron runtime, so we stub the
// 'electron' module in require's cache before pulling store.js in. Node's
// test runner gives each test file its own process, so this stub never
// leaks into other test files.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pomo-store-test-"));
require.cache[require.resolve("electron")] = {
  id: require.resolve("electron"),
  filename: require.resolve("electron"),
  loaded: true,
  exports: { app: { getPath: () => tmpDir } },
};
const store = require("../electron/store.js");

const dataFile = path.join(tmpDir, "pomodoro-data.json");

test("loadData returns defaults when no file exists yet", () => {
  const data = store.loadData();
  assert.deepEqual(data, store.defaultData());
});

test("saveData writes atomically and round-trips via loadData", () => {
  const data = store.defaultData();
  data.stats.byDay["2026-08-01"] = 3;
  store.saveData(data);

  assert.ok(fs.existsSync(dataFile), "data file should exist after save");
  const leftoverTmp = fs.readdirSync(tmpDir).filter((f) => f.includes(".tmp"));
  assert.equal(leftoverTmp.length, 0, "no temp file should remain after an atomic write");

  const reloaded = store.loadData();
  assert.equal(reloaded.stats.byDay["2026-08-01"], 3);
});

test("a corrupt data file falls back to defaults instead of throwing", () => {
  fs.writeFileSync(dataFile, "{ this is not valid json");
  assert.doesNotThrow(() => store.loadData());
  const data = store.loadData();
  assert.deepEqual(data, store.defaultData());
});

test("sanitizeData drops unknown keys, wrong types, and bad stat entries", () => {
  fs.writeFileSync(
    dataFile,
    JSON.stringify({
      settings: { focusMin: "not a number", muted: true, evilKey: "should be dropped" },
      stats: { byDay: { "2026-08-01": 5, "not-a-date": 9, "2026-07-01": -3 } },
    })
  );
  const data = store.loadData();
  assert.equal(data.settings.focusMin, 25, "invalid type falls back to default");
  assert.equal(data.settings.muted, true, "valid key/type is kept");
  assert.equal("evilKey" in data.settings, false, "unknown key is dropped");
  assert.deepEqual(Object.keys(data.stats.byDay), ["2026-08-01"]);
  assert.equal(data.stats.byDay["2026-08-01"], 5);
});

test("pruneStats keeps only the most recent 30 day keys", () => {
  // 40 distinct, lexicographically-sortable day keys spread across a few months.
  const manyDays = {};
  for (let i = 0; i < 40; i++) {
    manyDays[`2026-${String(Math.floor(i / 28) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`] = i;
  }
  const pruned = store.pruneStats(manyDays);
  assert.equal(Object.keys(pruned).length, 30);
});

test.after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
