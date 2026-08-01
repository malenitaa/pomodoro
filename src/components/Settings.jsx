import { useState } from "react";
import PixelIcon from "./PixelIcon.jsx";
import { ICONS } from "./pixelIcons.js";
import "./Settings.css";

function NumberField({ label, value, min, max, onCommit }) {
  const [draft, setDraft] = useState(String(value));

  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const num = Number(draft);
          if (Number.isFinite(num)) {
            const clamped = Math.min(max, Math.max(min, Math.round(num)));
            setDraft(String(clamped));
            onCommit(clamped);
          } else {
            setDraft(String(value));
          }
        }}
      />
    </label>
  );
}

export default function Settings({ settings, onUpdate, onClose }) {
  return (
    <div className="settings-panel">
      <div className="settings-header">
        <button type="button" className="settings-back" onClick={onClose} title="Volver">
          <PixelIcon matrix={ICONS.back} size={2} />
        </button>
        <span>CONFIGURACIÓN</span>
      </div>

      <div className="settings-body">
        <NumberField
          label="Foco (min)"
          value={settings.focusMin}
          min={1}
          max={180}
          onCommit={(v) => onUpdate({ focusMin: v })}
        />
        <NumberField
          label="Descanso corto (min)"
          value={settings.shortBreakMin}
          min={1}
          max={60}
          onCommit={(v) => onUpdate({ shortBreakMin: v })}
        />
        <NumberField
          label="Descanso largo (min)"
          value={settings.longBreakMin}
          min={1}
          max={120}
          onCommit={(v) => onUpdate({ longBreakMin: v })}
        />
        <NumberField
          label="Pomodoros antes del descanso largo"
          value={settings.pomodorosBeforeLongBreak}
          min={1}
          max={12}
          onCommit={(v) => onUpdate({ pomodorosBeforeLongBreak: v })}
        />

        <label className="settings-field settings-field--row">
          <span>Silenciar</span>
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(e) => onUpdate({ muted: e.target.checked })}
          />
        </label>

        <label className="settings-field">
          <span>Volumen</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            disabled={settings.muted}
            onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}
