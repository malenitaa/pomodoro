// UI strings. English is the source of truth; tests/i18n.test.cjs asserts
// that every language exposes exactly the same keys, so a missing
// translation fails the test suite instead of rendering undefined.

export const STRINGS = {
  en: {
    loading: "LOADING…",
    phaseFocus: "FOCUS",
    phaseShortBreak: "SHORT BREAK",
    phaseLongBreak: "LONG BREAK",
    today: "TODAY",
    resetBlock: "Restart block",
    start: "Start",
    pause: "Pause",
    skip: "Skip to next block",
    alwaysOnTop: "Keep on top",
    settings: "Settings",
    minimize: "Minimize",
    close: "Close",
    back: "Back",
    settingsTitle: "SETTINGS",
    focusMin: "Focus (min)",
    shortBreakMin: "Short break (min)",
    longBreakMin: "Long break (min)",
    pomodorosBeforeLongBreak: "Pomodoros before long break",
    mute: "Mute",
    volume: "Volume",
    language: "Language",
    languageAuto: "AUTO",
  },
  es: {
    loading: "CARGANDO…",
    phaseFocus: "FOCO",
    phaseShortBreak: "DESCANSO CORTO",
    phaseLongBreak: "DESCANSO LARGO",
    today: "HOY",
    resetBlock: "Reiniciar bloque",
    start: "Iniciar",
    pause: "Pausar",
    skip: "Saltear al siguiente bloque",
    alwaysOnTop: "Siempre visible arriba",
    settings: "Configuración",
    minimize: "Minimizar",
    close: "Cerrar",
    back: "Volver",
    settingsTitle: "CONFIGURACIÓN",
    focusMin: "Foco (min)",
    shortBreakMin: "Descanso corto (min)",
    longBreakMin: "Descanso largo (min)",
    pomodorosBeforeLongBreak: "Pomodoros antes del descanso largo",
    mute: "Silenciar",
    volume: "Volumen",
    language: "Idioma",
    languageAuto: "AUTO",
  },
};

// Maps the persisted setting ("auto" | "en" | "es") to a concrete language.
// "auto" follows the system locale, same rule as the main process.
export function resolveLanguage(setting) {
  if (setting === "en" || setting === "es") return setting;
  const locale = String(navigator.language || "").toLowerCase();
  return locale.startsWith("es") ? "es" : "en";
}

export function getStrings(languageSetting) {
  return STRINGS[resolveLanguage(languageSetting)];
}
