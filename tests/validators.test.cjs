"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSettingsPatch, validateBoolean } = require("../electron/validators.js");

test("accepts a single valid key", () => {
  const result = validateSettingsPatch({ focusMin: 30 });
  assert.deepEqual(result, { focusMin: 30 });
});

test("accepts multiple valid keys at once", () => {
  const result = validateSettingsPatch({ muted: true, volume: 0.5 });
  assert.deepEqual(result, { muted: true, volume: 0.5 });
});

test("rejects an out-of-range number", () => {
  assert.throws(() => validateSettingsPatch({ focusMin: 999 }), /between 1 and 180/);
});

test("rejects the wrong type for a numeric field", () => {
  assert.throws(() => validateSettingsPatch({ focusMin: "abc" }), /must be a finite number/);
});

test("rejects a non-integer where an integer is required", () => {
  assert.throws(() => validateSettingsPatch({ pomodorosBeforeLongBreak: 2.5 }), /must be an integer/);
});

test("rejects volume outside the 0..1 range", () => {
  assert.throws(() => validateSettingsPatch({ volume: 1.5 }), /between 0 and 1/);
});

test("rejects an unknown key — whole payload, not just the bad key", () => {
  assert.throws(() => validateSettingsPatch({ evilKey: "x" }), /unknown key "evilKey"/);
});

test("rejects a __proto__ prototype-pollution attempt", () => {
  const payload = JSON.parse('{"__proto__": {"polluted": true}}');
  assert.throws(() => validateSettingsPatch(payload));
  assert.equal({}.polluted, undefined, "Object.prototype must stay clean");
});

test("rejects non-object payloads", () => {
  assert.throws(() => validateSettingsPatch("not an object"));
  assert.throws(() => validateSettingsPatch(null));
  assert.throws(() => validateSettingsPatch(42));
  assert.throws(() => validateSettingsPatch(["array"]));
});

test("rejects an empty payload", () => {
  assert.throws(() => validateSettingsPatch({}), /empty update/);
});

test("validateBoolean accepts booleans and rejects everything else", () => {
  assert.equal(validateBoolean(true, "x"), true);
  assert.equal(validateBoolean(false, "x"), false);
  assert.throws(() => validateBoolean("true", "x"));
  assert.throws(() => validateBoolean(1, "x"));
  assert.throws(() => validateBoolean(null, "x"));
});
