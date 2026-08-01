import "./PomodoroCounter.css";

const MAX_DOTS = 8;

export default function PomodoroCounter({ count }) {
  const dots = Math.min(count, MAX_DOTS);
  const overflow = count > MAX_DOTS;

  return (
    <div className="pomo-counter">
      <span className="pomo-counter-label">HOY</span>
      <div className="pomo-counter-dots">
        {Array.from({ length: dots }).map((_, i) => (
          <span key={i} className="pomo-dot" />
        ))}
        {overflow && <span className="pomo-counter-extra">+{count - MAX_DOTS}</span>}
      </div>
      <span className="pomo-counter-number">{count}</span>
    </div>
  );
}
