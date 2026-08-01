"use strict";

// One-off generator for the app icon: a pixel-art tomato on a rounded
// violet plate, matching the in-app palette. Pure math + pngjs — no
// canvas, no network, no third-party art. Run with:
//   node scripts/generate-icon.cjs
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const GRID = 32; // pixel-art resolution
const OUT_SIZE = 1024; // final PNG size (electron-builder generates all
// other icon sizes — icns/ico/linux pngs — from this one source file)
const SCALE = OUT_SIZE / GRID;

function hex(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const PLATE_FILL = hex("#2e2151");
const PLATE_BORDER = hex("#6e56b8");
const TOMATO_SHADOW = hex("#c23b52");
const TOMATO_BASE = hex("#ff6b81");
const TOMATO_HIGHLIGHT = hex("#ffd3ee");
const LEAF_SHADOW = hex("#3a6b2f");
const LEAF_BASE = hex("#7fbf6a");
const STEM = hex("#4c8c3f");

function inRoundedSquare(x, y, size, margin, radius) {
  const min = margin;
  const max = size - margin;
  if (x < min || x >= max || y < min || y >= max) return false;
  const cx = x < min + radius ? min + radius : x > max - radius ? max - radius : x;
  const cy = y < min + radius ? min + radius : y > max - radius ? max - radius : y;
  if ((x < min + radius || x > max - radius) && (y < min + radius || y > max - radius)) {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    return dx * dx + dy * dy <= radius * radius;
  }
  return true;
}

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// Point-in-triangle via sign of cross products (half-plane test).
function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function buildLeaves() {
  const leaves = [];
  const originX = 16;
  const originY = 10.5;
  const angles = [-90, -90 - 70, -90 + 70, -90 - 140, -90 + 140];
  for (const deg of angles) {
    const a = (deg * Math.PI) / 180;
    const spread = 0.55;
    const tipX = originX + Math.cos(a) * 7.5;
    const tipY = originY + Math.sin(a) * 7.5 - 1;
    const leftX = originX + Math.cos(a + spread) * 2.4;
    const leftY = originY + Math.sin(a + spread) * 2.4;
    const rightX = originX + Math.cos(a - spread) * 2.4;
    const rightY = originY + Math.sin(a - spread) * 2.4;
    leaves.push([leftX, leftY, tipX, tipY, rightX, rightY]);
  }
  return leaves;
}

function pixelColor(x, y) {
  // Plate background (2px pixel border like the in-app .pixel-border look)
  if (!inRoundedSquare(x, y, GRID, 1, 5)) return null;
  let color = inRoundedSquare(x, y, GRID, 3, 4) ? PLATE_FILL : PLATE_BORDER;

  // Calyx leaves, behind the tomato body.
  const leaves = buildLeaves();
  for (const [ax, ay, bx, by, cx, cy] of leaves) {
    if (inTriangle(x + 0.5, y + 0.5, ax, ay, bx, by, cx, cy)) {
      color = y < 11 ? LEAF_SHADOW : LEAF_BASE;
    }
  }

  // Stem nub.
  if (x >= 15 && x <= 17 && y >= 6 && y <= 9) color = STEM;

  // Tomato body: shadow ellipse, base ellipse, highlight ellipse.
  if (inEllipse(x, y, 16, 19, 10.5, 9.5)) color = TOMATO_SHADOW;
  if (inEllipse(x, y, 15.3, 18.3, 9.6, 8.7)) color = TOMATO_BASE;
  if (inEllipse(x, y, 12, 15, 3.4, 2.8)) color = TOMATO_HIGHLIGHT;

  return color;
}

const png = new PNG({ width: OUT_SIZE, height: OUT_SIZE });

for (let gy = 0; gy < GRID; gy++) {
  for (let gx = 0; gx < GRID; gx++) {
    const color = pixelColor(gx, gy);
    for (let sy = 0; sy < SCALE; sy++) {
      for (let sx = 0; sx < SCALE; sx++) {
        const px = gx * SCALE + sx;
        const py = gy * SCALE + sy;
        const idx = (OUT_SIZE * py + px) << 2;
        if (color) {
          png.data[idx] = color[0];
          png.data[idx + 1] = color[1];
          png.data[idx + 2] = color[2];
          png.data[idx + 3] = 255;
        } else {
          png.data[idx + 3] = 0; // transparent outside the rounded plate
        }
      }
    }
  }
}

const outPath = path.join(__dirname, "..", "build", "icon.png");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
png.pack().pipe(fs.createWriteStream(outPath)).on("finish", () => {
  console.log("Wrote", outPath, `${OUT_SIZE}x${OUT_SIZE}`);
});
