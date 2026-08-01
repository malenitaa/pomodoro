"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createTimer } = require("../electron/timer.js");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Durations tiny enough to complete in well under a second, so the tests
// stay fast without needing to fake the clock. TICK_MS in timer.js is
// 250ms, so waits below are always comfortably past at least one tick.
function fastSettings(overrides = {}) {
  return {
    focusMin: 50 / 60000,
    shortBreakMin: 50 / 60000,
    longBreakMin: 50 / 60000,
    pomodorosBeforeLongBreak: 2,
    ...overrides,
  };
}

test("full cycle: focus -> shortBreak -> focus -> longBreak, counting pomodoros", async () => {
  const settings = fastSettings();
  const events = [];
  const timer = createTimer({
    getSettings: () => settings,
    onTick: () => {},
    onBlockComplete: (e) => events.push(e),
  });

  assert.equal(timer.getState().phase, "focus");

  timer.start();
  await wait(300);
  assert.equal(timer.getState().phase, "shortBreak");
  assert.equal(timer.getState().pomodoroCount, 1);

  timer.start();
  await wait(300);
  assert.equal(timer.getState().phase, "focus");

  timer.start();
  await wait(300);
  assert.equal(timer.getState().phase, "longBreak", "2nd pomodoro with pomodorosBeforeLongBreak=2 -> long break");
  assert.equal(timer.getState().pomodoroCount, 2);

  assert.equal(events.length, 3);
  assert.deepEqual(
    events.map((e) => e.finishedPhase),
    ["focus", "shortBreak", "focus"]
  );
});

test("pause freezes remaining time; resume continues from where it left off", async () => {
  const settings = fastSettings({ focusMin: 5000 / 60000 }); // ~5s, plenty of headroom
  const timer = createTimer({ getSettings: () => settings, onTick: () => {}, onBlockComplete: () => {} });

  timer.start();
  await wait(200);
  const paused = timer.pause();
  const remainingAtPause = paused.remainingMs;

  await wait(300); // real time passes while paused
  const stillPaused = timer.getState();
  assert.ok(
    Math.abs(stillPaused.remainingMs - remainingAtPause) < 5,
    "remaining time must not move while paused"
  );

  timer.start();
  await wait(20);
  const resumed = timer.getState();
  assert.ok(resumed.remainingMs <= remainingAtPause, "time should resume counting down, not jump back up");
  assert.ok(resumed.remainingMs > remainingAtPause - 50, "resume should pick up close to the pre-pause value");
});

test("skip advances the phase without firing onBlockComplete or double-counting", () => {
  const settings = fastSettings();
  const events = [];
  const timer = createTimer({
    getSettings: () => settings,
    onTick: () => {},
    onBlockComplete: (e) => events.push(e),
  });

  assert.equal(timer.getState().phase, "focus");
  timer.skip();
  assert.equal(timer.getState().phase, "shortBreak");
  assert.equal(events.length, 0, "skip must not emit a completion event");
});

test("reset returns the current phase to its full duration and idle status", async () => {
  const settings = fastSettings();
  const timer = createTimer({ getSettings: () => settings, onTick: () => {}, onBlockComplete: () => {} });

  timer.start();
  await wait(20);
  const reset = timer.reset();
  assert.equal(reset.status, "idle");
  assert.equal(reset.remainingMs, reset.durationMs);
});
