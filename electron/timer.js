"use strict";

// Pomodoro state machine. Runs entirely in the main process and derives
// remaining time from real wall-clock timestamps (Date.now()) on every
// tick, rather than counting down an in-memory number once per interval.
// That means a laptop sleep/wake cycle or a delayed timer (e.g. the
// renderer/window being minimized/throttled) can never desync the clock:
// whenever the next tick does run, it recomputes remaining time from the
// real elapsed wall time, not from how many ticks fired.

const TICK_MS = 250;

const PHASES = ["focus", "shortBreak", "longBreak"];

function phaseDurationMs(phase, settings) {
  switch (phase) {
    case "focus":
      return settings.focusMin * 60 * 1000;
    case "shortBreak":
      return settings.shortBreakMin * 60 * 1000;
    case "longBreak":
      return settings.longBreakMin * 60 * 1000;
    default:
      return settings.focusMin * 60 * 1000;
  }
}

function createTimer({ getSettings, onTick, onBlockComplete }) {
  let phase = "focus";
  let status = "idle"; // 'idle' | 'running' | 'paused'
  let durationMs = phaseDurationMs(phase, getSettings());
  let startTimestamp = null; // Date.now() when current run began (resume-adjusted)
  let remainingAtPause = durationMs;
  let pomodoroCount = 0; // completed focus blocks in the current long-break cycle
  let intervalHandle = null;

  function remainingMs() {
    if (status === "running" && startTimestamp !== null) {
      return Math.max(0, durationMs - (Date.now() - startTimestamp));
    }
    return remainingAtPause;
  }

  function publicState() {
    return {
      phase,
      status,
      remainingMs: remainingMs(),
      durationMs,
      pomodoroCount,
      pomodorosBeforeLongBreak: getSettings().pomodorosBeforeLongBreak,
    };
  }

  function emit() {
    onTick(publicState());
  }

  function ensureInterval() {
    if (intervalHandle) return;
    intervalHandle = setInterval(tick, TICK_MS);
  }

  function clearRunInterval() {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  function tick() {
    if (status !== "running") return;
    if (remainingMs() <= 0) {
      completeBlock();
      return;
    }
    emit();
  }

  function nextPhaseAfter(finishedPhase) {
    if (finishedPhase === "focus") {
      const settings = getSettings();
      const isLongBreak = pomodoroCount > 0 && pomodoroCount % settings.pomodorosBeforeLongBreak === 0;
      return isLongBreak ? "longBreak" : "shortBreak";
    }
    return "focus";
  }

  function completeBlock() {
    const finishedPhase = phase;
    if (finishedPhase === "focus") {
      pomodoroCount += 1;
    }
    const upcoming = nextPhaseAfter(finishedPhase);
    phase = upcoming;
    durationMs = phaseDurationMs(phase, getSettings());
    remainingAtPause = durationMs;
    startTimestamp = null;
    status = "idle";
    clearRunInterval();
    onBlockComplete({ finishedPhase, nextPhase: upcoming, pomodoroCount });
    emit();
  }

  function start() {
    if (status === "running") return publicState();
    startTimestamp = Date.now() - (durationMs - remainingAtPause);
    status = "running";
    ensureInterval();
    emit();
    return publicState();
  }

  function pause() {
    if (status !== "running") return publicState();
    remainingAtPause = remainingMs();
    startTimestamp = null;
    status = "paused";
    clearRunInterval();
    emit();
    return publicState();
  }

  function reset() {
    durationMs = phaseDurationMs(phase, getSettings());
    remainingAtPause = durationMs;
    startTimestamp = null;
    status = "idle";
    clearRunInterval();
    emit();
    return publicState();
  }

  // Skip does NOT count the current block as completed (no stats increment,
  // no sound/notification) — it just advances the cycle immediately.
  function skip() {
    const finishedPhase = phase;
    if (finishedPhase === "focus") {
      pomodoroCount += 1;
    }
    phase = nextPhaseAfter(finishedPhase);
    durationMs = phaseDurationMs(phase, getSettings());
    remainingAtPause = durationMs;
    startTimestamp = null;
    status = "idle";
    clearRunInterval();
    emit();
    return publicState();
  }

  // Called when settings change while idle/paused, so a duration edit is
  // reflected immediately instead of waiting for the next phase change.
  function applySettingsChange() {
    if (status === "running") return publicState();
    durationMs = phaseDurationMs(phase, getSettings());
    remainingAtPause = durationMs;
    emit();
    return publicState();
  }

  return {
    start,
    pause,
    reset,
    skip,
    applySettingsChange,
    getState: publicState,
    PHASES,
  };
}

module.exports = { createTimer, phaseDurationMs, PHASES };
