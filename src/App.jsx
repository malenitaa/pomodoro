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
import "./App.css";

const PHASE_LABEL = {
  focus: "FOCO",
  shortBreak: "DESCANSO CORTO",
  longBreak: "DESCANSO LARGO",
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

  useEffect(() => {
    document.title = state ? `${formatTime(state.remainingMs)} · ${PHASE_LABEL[state.phase]}` : "Pixel Pomodoro";
  }, [state]);

  if (!state || !settings) {
    return (
      <div className="app-shell">
        <TitleBar
          alwaysOnTop={false}
          onToggleAlwaysOnTop={() => {}}
          onMinimize={() => window.pomodoro.window.minimize()}
          onClose={() => window.pomodoro.window.close()}
          onToggleSettings={() => {}}
          settingsOpen={false}
        />
        <div className="app-loading">CARGANDO…</div>
      </div>
    );
  }

  const progress = state.durationMs > 0 ? 1 - state.remainingMs / state.durationMs : 0;
  const isFocus = state.phase === "focus";

  return (
    <div className="app-shell">
      <TitleBar
        alwaysOnTop={settings.alwaysOnTop}
        onToggleAlwaysOnTop={() => update({ alwaysOnTop: !settings.alwaysOnTop })}
        onMinimize={() => window.pomodoro.window.minimize()}
        onClose={() => window.pomodoro.window.close()}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        settingsOpen={settingsOpen}
      />

      {settingsOpen ? (
        <Settings settings={settings} onUpdate={update} onClose={() => setSettingsOpen(false)} />
      ) : (
        <div className="app-main">
          <div className="phase-label">{PHASE_LABEL[state.phase]}</div>

          <div className="centerpiece">
            {isFocus ? (
              <Candle progress={progress} running={state.status === "running"} />
            ) : (
              <TeaCup animated={state.status === "running"} />
            )}
          </div>

          <div className="timer-display">{formatTime(state.remainingMs)}</div>

          <ProgressBar progress={progress} phase={state.phase} />

          <PomodoroCounter count={state.todayCount} />

          <Controls status={state.status} onStart={start} onPause={pause} onReset={reset} onSkip={skip} />
        </div>
      )}
    </div>
  );
}
