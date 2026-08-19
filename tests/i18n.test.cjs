"use strict";

const test = require("node:test");
const assert = require("node:assert");

const { NOTIFICATIONS, resolveLanguage } = require("../electron/i18n.js");

test("notification dictionaries expose the same keys in every language", () => {
  const enKeys = Object.keys(NOTIFICATIONS.en).sort();
  for (const lang of Object.keys(NOTIFICATIONS)) {
    assert.deepEqual(Object.keys(NOTIFICATIONS[lang]).sort(), enKeys, `language "${lang}" is out of sync`);
  }
});

test("renderer dictionaries expose the same keys in every language", async () => {
  const { STRINGS } = await import("../src/i18n/strings.js");
  const enKeys = Object.keys(STRINGS.en).sort();
  assert.ok(enKeys.length > 0);
  for (const lang of Object.keys(STRINGS)) {
    assert.deepEqual(Object.keys(STRINGS[lang]).sort(), enKeys, `language "${lang}" is out of sync`);
  }
});

test("resolveLanguage honors explicit choices and falls back via locale", () => {
  assert.equal(resolveLanguage("en", () => "es-AR"), "en");
  assert.equal(resolveLanguage("es", () => "en-US"), "es");
  assert.equal(resolveLanguage("auto", () => "es-AR"), "es");
  assert.equal(resolveLanguage("auto", () => "en-US"), "en");
  assert.equal(resolveLanguage("auto", () => ""), "en");
  assert.equal(resolveLanguage(undefined, () => "es"), "es");
});
