import PixelIcon from "./PixelIcon.jsx";
import { ICONS } from "./pixelIcons.js";
import "./Controls.css";

export default function Controls({ t, status, onStart, onPause, onReset, onSkip }) {
  const isRunning = status === "running";

  return (
    <div className="controls">
      <button type="button" className="control-btn control-btn--ghost" onClick={onReset} title={t.resetBlock}>
        <PixelIcon matrix={ICONS.reset} size={2} />
      </button>
      <button
        type="button"
        className="control-btn control-btn--primary"
        onClick={isRunning ? onPause : onStart}
        title={isRunning ? t.pause : t.start}
      >
        <PixelIcon matrix={isRunning ? ICONS.pause : ICONS.play} size={3} />
      </button>
      <button type="button" className="control-btn control-btn--ghost" onClick={onSkip} title={t.skip}>
        <PixelIcon matrix={ICONS.skip} size={2} />
      </button>
    </div>
  );
}
