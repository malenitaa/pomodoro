"use strict";

// One-off generator for the local notification chime bundled with the app.
// Produces a short, soft two-note bell (no samples, no network) as a
// 16-bit PCM mono WAV file. Run with: node scripts/generate-chime.cjs
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;
const DURATION_S = 1.1;
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION_S);

function envelope(t, attack, decay) {
  if (t < attack) return t / attack;
  return Math.exp(-(t - attack) * decay);
}

const samples = new Float32Array(NUM_SAMPLES);
// Two soft sine partials (a gentle major third) with independent decays,
// like a small pixel-art "bell" rather than a harsh beep.
const notes = [
  { freq: 880, start: 0, attack: 0.01, decay: 3.2, gain: 0.5 },
  { freq: 1108.73, start: 0.08, attack: 0.01, decay: 3.6, gain: 0.32 },
];

for (let i = 0; i < NUM_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  let value = 0;
  for (const note of notes) {
    const nt = t - note.start;
    if (nt < 0) continue;
    value += note.gain * envelope(nt, note.attack, note.decay) * Math.sin(2 * Math.PI * note.freq * nt);
  }
  samples[i] = value;
}

// Normalize and soft-clip to avoid any harsh peaks.
let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const norm = peak > 0 ? 0.85 / peak : 1;

const pcm = Buffer.alloc(NUM_SAMPLES * 2);
for (let i = 0; i < NUM_SAMPLES; i++) {
  const v = Math.max(-1, Math.min(1, samples[i] * norm));
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}

function wavHeader(dataLength) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

const outPath = path.join(__dirname, "..", "src", "assets", "sounds", "chime.wav");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.concat([wavHeader(pcm.length), pcm]));
console.log("Wrote", outPath, `${(pcm.length / 1024).toFixed(1)} KB`);
