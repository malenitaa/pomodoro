import { useEffect, useRef, useState } from "react";
import "./TeaCup.css";

const PALETTE = {
  cup: "#7c5cff",
  cupShadow: "#5a3fc0",
  cupLight: "#b9a3ff",
  steam: "#e8e0ff",
};

const W = 32;
const H = 48;
const SCALE = 3;
const FRAME_INTERVAL_MS = 130; // ~7-8fps, deliberately choppy

// Three steam-puff layouts that cycle to suggest rising, drifting steam
// without any smooth interpolation.
const STEAM_FRAMES = [
  [
    [14, 10],
    [15, 6],
    [18, 12],
    [19, 8],
  ],
  [
    [13, 8],
    [16, 4],
    [17, 10],
    [20, 6],
  ],
  [
    [15, 12],
    [14, 7],
    [19, 9],
    [18, 5],
  ],
];

function drawCup(ctx, frame) {
  ctx.clearRect(0, 0, W, H);

  // saucer
  ctx.fillStyle = PALETTE.cupShadow;
  ctx.fillRect(4, 38, 24, 3);
  ctx.fillStyle = PALETTE.cup;
  ctx.fillRect(4, 36, 24, 2);

  // cup body
  ctx.fillStyle = PALETTE.cupShadow;
  ctx.fillRect(8, 24, 16, 12);
  ctx.fillStyle = PALETTE.cup;
  ctx.fillRect(9, 24, 14, 11);
  ctx.fillStyle = PALETTE.cupLight;
  ctx.fillRect(9, 24, 14, 2);

  // handle
  ctx.fillStyle = PALETTE.cup;
  ctx.fillRect(24, 27, 3, 2);
  ctx.fillRect(26, 28, 2, 4);
  ctx.fillRect(24, 32, 3, 2);

  // steam puffs, cycling frames
  ctx.fillStyle = PALETTE.steam;
  for (const [x, y] of STEAM_FRAMES[frame % STEAM_FRAMES.length]) {
    ctx.fillRect(x, y, 2, 2);
  }
}

export default function TeaCup({ animated = true }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animated) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % STEAM_FRAMES.length), FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [animated]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawCup(ctx, frame);
  }, [frame]);

  return (
    <div className="teacup-wrap">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="teacup-canvas"
        style={{ width: W * SCALE, height: H * SCALE }}
      />
    </div>
  );
}
