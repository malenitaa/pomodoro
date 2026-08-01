import { useEffect, useRef, useState } from "react";
import "./Candle.css";

// All candle art is drawn procedurally onto a tiny canvas (no image
// assets) and scaled up with image-rendering: pixelated for a crisp,
// low-fps pixel-art look instead of smooth vector animation.
const PALETTE = {
  waxLight: "#fbe8ff",
  waxShadow: "#d9b8e8",
  wick: "#3a2a4d",
  flameOuter: "#ffd873",
  flameCore: "#fff3c4",
  holder: "#6e56b8",
  holderShadow: "#4a3a86",
};

const W = 32;
const H = 48;
const SCALE = 3;
const FLAME_VARIANTS = [
  { h: 9, w: 5, dx: 0 },
  { h: 11, w: 4, dx: 1 },
  { h: 8, w: 6, dx: -1 },
];
const FRAME_INTERVAL_MS = 110; // ~9fps flicker, intentionally choppy

function drawFlameShape(ctx, cx, baseY, width, height) {
  for (let row = 0; row < height; row++) {
    const t = row / height;
    const rowWidth = Math.max(1, Math.round(width * Math.sin(Math.PI * (1 - t) * 0.9 + 0.1)));
    const x = cx - Math.floor(rowWidth / 2);
    ctx.fillRect(x, baseY - row, rowWidth, 1);
  }
}

function drawCandle(ctx, { progress, frame }) {
  ctx.clearRect(0, 0, W, H);

  const holderY = 40;
  ctx.fillStyle = PALETTE.holderShadow;
  ctx.fillRect(6, holderY + 4, 20, 3);
  ctx.fillStyle = PALETTE.holder;
  ctx.fillRect(6, holderY + 2, 20, 2);

  const waxTopFull = 12;
  const waxTopMelted = 34;
  const waxTop = Math.round(waxTopFull + (waxTopMelted - waxTopFull) * progress);
  const waxBottom = holderY;
  const waxLeft = 12;
  const waxRight = 20;

  const poolWidth = Math.round(20 + 6 * progress);
  ctx.fillStyle = PALETTE.waxShadow;
  ctx.fillRect(16 - poolWidth / 2, waxBottom - 1, poolWidth, 3);

  ctx.fillStyle = PALETTE.waxShadow;
  ctx.fillRect(waxLeft, waxTop, waxRight - waxLeft, waxBottom - waxTop);
  ctx.fillStyle = PALETTE.waxLight;
  ctx.fillRect(waxLeft + 1, waxTop, waxRight - waxLeft - 2, waxBottom - waxTop);

  ctx.fillStyle = PALETTE.waxShadow;
  ctx.fillRect(waxLeft + 1, waxTop + 4, 1, Math.max(0, waxBottom - waxTop - 6));

  ctx.fillStyle = PALETTE.wick;
  ctx.fillRect(15, waxTop - 3, 2, 3);

  const v = FLAME_VARIANTS[frame % FLAME_VARIANTS.length];
  const fx = 16 + v.dx;
  const fyBase = waxTop - 3;

  ctx.fillStyle = PALETTE.flameOuter;
  drawFlameShape(ctx, fx, fyBase, v.w, v.h);
  ctx.fillStyle = PALETTE.flameCore;
  drawFlameShape(ctx, fx, fyBase, Math.max(1, v.w - 2), Math.max(1, v.h - 4));
}

// progress: 0 (fresh candle) -> 1 (fully melted). running: whether the
// flame should flicker (paused = frozen on current frame).
export default function Candle({ progress = 0, running = false }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % FLAME_VARIANTS.length), FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawCandle(ctx, { progress: Math.min(1, Math.max(0, progress)), frame });
  }, [progress, frame]);

  return (
    <div className="candle-wrap">
      <div className="candle-glow" style={{ opacity: running ? 0.8 : 0.35 }} />
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="candle-canvas"
        style={{ width: W * SCALE, height: H * SCALE }}
      />
    </div>
  );
}
