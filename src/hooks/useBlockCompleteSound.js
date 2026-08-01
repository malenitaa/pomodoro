import { useEffect, useRef } from "react";
import chimeUrl from "../assets/sounds/chime.wav";

// Native OS notifications are fired from the main process; this hook only
// handles playing the local bundled chime in the renderer, respecting the
// current mute/volume settings at the moment a block completes.
export default function useBlockCompleteSound(settings) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const audio = new Audio(chimeUrl);

    const unsubscribe = window.pomodoro.timer.onBlockComplete(() => {
      const current = settingsRef.current;
      if (!current || current.muted) return;
      audio.volume = Math.min(1, Math.max(0, current.volume));
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    return unsubscribe;
  }, []);
}
