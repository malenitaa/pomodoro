"use strict";

// Every payload that arrives over IPC from the (untrusted, sandboxed)
// renderer is validated here before main does anything with it. Unknown
// keys or out-of-range/wrong-typed values cause the whole payload to be
// rejected (thrown), never silently coerced or partially applied.

const SETTINGS_FIELDS = {
  focusMin: { type: "number", min: 1, max: 180 },
  shortBreakMin: { type: "number", min: 1, max: 60 },
  longBreakMin: { type: "number", min: 1, max: 120 },
  pomodorosBeforeLongBreak: { type: "integer", min: 1, max: 12 },
  volume: { type: "number", min: 0, max: 1 },
  muted: { type: "boolean" },
  alwaysOnTop: { type: "boolean" },
};

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkField(name, value, rule) {
  if (rule.type === "boolean") {
    if (typeof value !== "boolean") {
      throw new Error(`Invalid settings payload: "${name}" must be a boolean`);
    }
    return;
  }
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`Invalid settings payload: "${name}" must be a finite number`);
  }
  if (rule.type === "integer" && !Number.isInteger(value)) {
    throw new Error(`Invalid settings payload: "${name}" must be an integer`);
  }
  if (value < rule.min || value > rule.max) {
    throw new Error(`Invalid settings payload: "${name}" must be between ${rule.min} and ${rule.max}`);
  }
}

// Validates a *partial* settings update. Throws on any unknown key or
// invalid value; returns the payload untouched (already validated) so the
// caller can merge it onto existing settings.
function validateSettingsPatch(payload) {
  if (!isPlainObject(payload)) {
    throw new Error("Invalid settings payload: expected an object");
  }
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("Invalid settings payload: empty update");
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(SETTINGS_FIELDS, key)) {
      throw new Error(`Invalid settings payload: unknown key "${key}"`);
    }
    checkField(key, payload[key], SETTINGS_FIELDS[key]);
  }
  return payload;
}

function validateBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid payload: "${label}" must be a boolean`);
  }
  return value;
}

module.exports = { validateSettingsPatch, validateBoolean, SETTINGS_FIELDS };
