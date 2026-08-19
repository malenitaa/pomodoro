import { useEffect, useState } from "react";
import TitleBar from "./components/TitleBar.jsx";
import Candle from "./components/Candle.jsx";
import TeaCup from "./components/TeaCup.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import PomodoroCounter from "./components/PomodoroCounter.jsx";
import Controls from "./components/Controls.jsx";
import Settings from "./components/Settings.jsx";
import useTimer from "./hooks/useTimer.js";
import useSettings from "./hooks/useSettings.js";
import useBlockCompleteSound from "./hooks/useBlockCompleteSound.js";
import { getStrings } from "./i18n/strings.js";
import "./App.css";

const PHASE_KEY = {
  focus: "phaseFocus",
  shortBreak: "phaseShortBreak",
  longBreak: "phaseLongBreak",
};

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function App() {
  const { state, start, pause, reset, skip } = useTimer();
  const { settings, update } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useBlockCompleteSound(settings);

  const t = getStrings(settings ? settings.language : "auto");

  useEffect(() => {
    document.title = state ? `${formatTime(state.remainingMs)} · ${t[PHASE_KEY[state.phase]]}` : "Pixel Pomodoro";
  }, [state, t]);

  if (!state || !settings) {
    return (
      <div className="app-shell">
        <TitleBar
          t={t}
          alwaysOnTop={false}
          onToggleAlwaysOnTop={() => {}}
          onMinimize={() => window.pomodoro.window.minimize()}
          onClose={() => window.pomodoro.window.close()}
          onToggleSettings={() => {}}
          settingsOpen={false}
        />
        <div className="app-loading">{t.loading}</div>
      </div>
    );
  }

  const progress = state.durationMs > 0 ? 1 - state.remainingMs / state.durationMs : 0;
  const isFocus = state.phase === "focus";

  return (
    <div className="app-shell">
      <TitleBar
        t={t}
        alwaysOnTop={settings.alwaysOnTop}
        onToggleAlwaysOnTop={() => update({ alwaysOnTop: !settings.alwaysOnTop })}
        onMinimize={() => window.pomodoro.window.minimize()}
        onClose={() => window.pomodoro.window.close()}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        settingsOpen={settingsOpen}
      />

      {settingsOpen ? (
        <Settings t={t} settings={settings} onUpdate={update} onClose={() => setSettingsOpen(false)} />
      ) : (
        <div className="app-main">
          <div className="phase-label">{t[PHASE_KEY[state.phase]]}</div>

          <div className="centerpiece">
            {isFocus ? (
              <Candle progress={progress} running={state.status === "running"} />
            ) : (
              <TeaCup animated={state.status === "running"} />
            )}
          </div>

          <div className="timer-display">{formatTime(state.remainingMs)}</div>

          <ProgressBar progress={progress} phase={state.phase} />

          <PomodoroCounter t={t} count={state.todayCount} />

          <Controls t={t} status={state.status} onStart={start} onPause={pause} onReset={reset} onSkip={skip} />
        </div>
      )}
    </div>
  );
}
