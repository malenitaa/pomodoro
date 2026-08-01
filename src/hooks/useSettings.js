import { useCallback, useEffect, useState } from "react";

export default function useSettings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    window.pomodoro.settings.get().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch) => {
    const next = await window.pomodoro.settings.update(patch);
    setSettings(next);
    return next;
  }, []);

  return { settings, update };
}
