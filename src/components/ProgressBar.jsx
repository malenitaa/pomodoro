import "./ProgressBar.css";

const SEGMENTS = 20;

// progress: 0..1. phase drives the color theme (focus/shortBreak/longBreak).
export default function ProgressBar({ progress, phase }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const filled = Math.round(clamped * SEGMENTS);

  return (
    <div className={`progress-bar progress-bar--${phase}`}>
      <div className="progress-track">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span key={i} className={`progress-seg ${i < filled ? "filled" : ""}`} />
        ))}
        <div className="progress-marker" style={{ left: `calc(${clamped * 100}% - 2px)` }} />
      </div>
    </div>
  );
}
