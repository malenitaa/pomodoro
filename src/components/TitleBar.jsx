import PixelIcon from "./PixelIcon.jsx";
import { ICONS } from "./pixelIcons.js";
import "./TitleBar.css";

export default function TitleBar({ t, alwaysOnTop, onToggleAlwaysOnTop, onMinimize, onClose, onToggleSettings, settingsOpen }) {
  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-title">✿ POMODORO</span>
      </div>
      <div className="titlebar-buttons">
        <button
          type="button"
          className={`titlebar-btn ${alwaysOnTop ? "is-active" : ""}`}
          onClick={onToggleAlwaysOnTop}
          title={t.alwaysOnTop}
          aria-pressed={alwaysOnTop}
        >
          <PixelIcon matrix={ICONS.pin} size={2} />
        </button>
        <button
          type="button"
          className={`titlebar-btn ${settingsOpen ? "is-active" : ""}`}
          onClick={onToggleSettings}
          title={t.settings}
          aria-pressed={settingsOpen}
        >
          <PixelIcon matrix={ICONS.gear} size={2} />
        </button>
        <button type="button" className="titlebar-btn" onClick={onMinimize} title={t.minimize}>
          <PixelIcon matrix={ICONS.minimize} size={2} />
        </button>
        <button type="button" className="titlebar-btn titlebar-btn--close" onClick={onClose} title={t.close}>
          <PixelIcon matrix={ICONS.close} size={2} />
        </button>
      </div>
    </div>
  );
}
