"use strict";

// Main-process strings (native notifications). The renderer has its own
// dictionary in src/i18n/strings.js; tests/i18n.test.cjs asserts both stay
// in sync between languages. English is the source of truth.

const NOTIFICATIONS = {
  en: {
    focusDone: "Focus block finished!",
    breakDone: "Break finished!",
    backToFocus: "Time to get back to focus.",
    takeLongBreak: "Take a long break.",
    takeShortBreak: "Take a short break.",
  },
  es: {
    focusDone: "¡Bloque de foco terminado!",
    breakDone: "¡Descanso terminado!",
    backToFocus: "Hora de volver al foco.",
    takeLongBreak: "Tomate un descanso largo.",
    takeShortBreak: "Tomate un descanso corto.",
  },
};

// Maps the persisted setting ("auto" | "en" | "es") to a concrete language.
// `getLocale` is injected so this stays testable without Electron.
function resolveLanguage(setting, getLocale) {
  if (setting === "en" || setting === "es") return setting;
  const locale = String(getLocale() || "").toLowerCase();
  return locale.startsWith("es") ? "es" : "en";
}

function notificationStrings(language) {
  return NOTIFICATIONS[language] || NOTIFICATIONS.en;
}

module.exports = { NOTIFICATIONS, resolveLanguage, notificationStrings };
