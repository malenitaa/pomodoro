import { useCallback, useEffect, useState } from "react";

// Thin subscription layer over the main-process timer exposed by preload.
// The renderer never computes remaining time itself — it just renders
// whatever state main pushes, which main derives from Date.now().
export default function useTimer() {
  const [state, setState] = useState(null);

  useEffect(() => {
    let cancelled = false;

    window.pomodoro.timer.getState().then((s) => {
      if (!cancelled) setState(s);
    });

    const unsubscribe = window.pomodoro.timer.onState((s) => setState(s));

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const start = useCallback(() => window.pomodoro.timer.start(), []);
  const pause = useCallback(() => window.pomodoro.timer.pause(), []);
  const reset = useCallback(() => window.pomodoro.timer.reset(), []);
  const skip = useCallback(() => window.pomodoro.timer.skip(), []);

  return { state, start, pause, reset, skip };
}
