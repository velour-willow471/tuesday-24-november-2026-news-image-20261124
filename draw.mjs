// draw.mjs — renders entry.png for Tuesday 24 November 2026 from scratch.
// Pure Node.js standard library: a small raster canvas, a hand-made 5x7
// bitmap font, simple vector shapes, and a hand-rolled PNG encoder.
// No dependencies, no network, no external fonts. Deterministic output.
//
// Stories verified 24 Nov 2026 against Al Jazeera, Reuters, CNN, BBC,
// the US Treasury, GOV.UK, Oxfam and FIFA:
//   1. Iran says three oil tankers hit naval mines and caught fire in the
//      Strait of Hormuz (IRGC via Al Jazeera live blog, 24 Nov).
//   2. Nvidia soars 31% in its best day since 2003 as Jensen Huang
//      returns as CEO; Nasdaq jumps 6.5%, S&P 500 4.7% (CNN/Reuters, 24 Nov).
//   3. US Treasury sanctions 30 people and firms in Iran's shadow
//      banking network; $14.7bn of flows traced (Treasury/ANI, 24 Nov).
//   4. Oxfam and CEOBS: Israeli attacks turned Gaza into a toxic
//      wasteland, contamination signs across 99% of the Strip (Oxfam/CNN).
//   5. UK formally recognises the Rohingya genocide and sanctions five
//      Myanmar generals; £8m in aid and justice funding (GOV.UK/BBC).
//   6. FIFA confirms the 2031 Women's World Cup for a US-led bid and
//      the 2035 edition for the UK; 48 teams for the first time (FIFA/Reuters).

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ------------------------------------------------------------------ palette
const PAL = {
  paper: [244, 240, 230],
  ink: [20, 26, 40],
  navy: [16, 34, 66],
  navySoft: [30, 58, 100],
  red: [176, 32, 32],
  white: [255, 255, 255],
  grey: [96, 102, 116],
  edge: [210, 212, 216],
  card: [255, 255, 255],
  gold: [198, 148, 30],
  green: [30, 118, 62],
  sky: [168, 206, 232],
  sea: [22, 64, 104],
  deepSea: [14, 46, 80],
  sand: [228, 210, 166],
  orange: [228, 104, 20],
  yellow: [244, 192, 44],
  smoke: [118, 122, 130],
  teal: [24, 96, 96],
  body: [54, 60, 74],
};

// ------------------------------------------------------------------ canvas
const buf = new Uint8Array(W * H * 3);
function paintAll([r, g, b]) {
  for (let i = 0; i < W * H; i++) {
    buf[i * 3] = r; buf[i * 3 + 1] = g; buf[i * 3 + 2] = b;
  }
}
function dot(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
}
function box(x, y, w, h, col) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) dot(i, j, col);
}
function hbar(x0, x1, y, col, t = 1) {
  for (let k = 0; k < t; k++) for (let x = x0; x <= x1; x++) dot(x, y + k, col);
}
function vbar(x, y0, y1, col, t = 1) {
  for (let k = 0; k < t; k++) for (let y = y0; y <= y1; y++) dot(x + k, y, col);
}
function seg(x0, y0, x1, y1, col, t = 1) {
  // Bresenham with a square brush.
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  const h = Math.floor(t / 2);
  for (;;) {
    for (let a = -h; a <= h; a++)
      for (let b = -h; b <= h; b++) dot(x + a, y + b, col);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}
function disc(cx, cy, r, col, solid = true) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (solid ? d <= r : d <= r && d >= r - 1.5) dot(cx + x, cy + y, col);
    }
}
function tri(x0, y0, x1, y1, x2, y2, col) {
  const loX = Math.min(x0, x1, x2), hiX = Math.max(x0, x1, x2);
  const loY = Math.min(y0, y1, y2), hiY = Math.max(y0, y1, y2);
  const s = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  for (let y = loY; y <= hiY; y++)
    for (let x = loX; x <= hiX; x++) {
      const d0 = s(x, y, x0, y0, x1, y1);
      const d1 = s(x, y, x1, y1, x2, y2);
      const d2 = s(x, y, x2, y2, x0, y0);
      if (!((d0 < 0 || d1 < 0 || d2 < 0) && (d0 > 0 || d1 > 0 || d2 > 0))) dot(x, y, col);
    }
}
function oval(cx, cy, rx, ry, col) {
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) dot(cx + x, cy + y, col);
}

// ------------------------------------------------------------------ 5x7 font
// Glyphs as 7 rows of 5 bits, drawn by hand for this image.
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
};
function strWidth(s, scale) { return s.length * 6 * scale - scale; }
function putText(x, y, s, scale, col) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r][c] === '1') box(cx + c * scale, y + r * scale, scale, scale, col);
    cx += 6 * scale;
  }
  return cx;
}
function putCentred(cx, y, s, scale, col) {
  return putText(cx - Math.floor(strWidth(s, scale) / 2), y, s, scale, col);
}
// Greedy word wrap; returns the lines that fit maxWidth at scale.
function wrapText(s, scale, maxWidth) {
  const out = [];
  let cur = '';
  for (const w of s.split(' ')) {
    const trial = cur ? cur + ' ' + w : w;
    if (strWidth(trial, scale) <= maxWidth) { cur = trial; continue; }
    if (cur) out.push(cur);
    cur = w;
  }
  if (cur) out.push(cur);
  return out;
}

// ------------------------------------------------------------------ scenes
// Each scene draws inside (x, y, w, h). All original vector art.

// 1. Hormuz: three tankers ablaze on a dark strait, flames and black
// smoke rising, a spiked mine floating between them, a red warning arc.
function sceneHormuz(x, y, w, h) {
  box(x, y, w, h, [40, 44, 52]); // night sky over the strait
  disc(x + Math.floor(w * 0.84), y + Math.floor(h * 0.18), 13, [232, 214, 170]);
  box(x, y + Math.floor(h * 0.58), w, h - Math.floor(h * 0.58), PAL.deepSea); // sea
  box(x, y + Math.floor(h * 0.58), w, 4, [90, 120, 150]);
  // three burning tankers, left to right, hulls low in the water
  const ships = [
    [0.06, 0.46, 0.30], [0.38, 0.50, 0.26], [0.66, 0.44, 0.28],
  ];
  for (const [fx, fy, fw] of ships) {
    const sx = x + Math.floor(w * fx), sy = y + Math.floor(h * fy);
    const sw = Math.floor(w * fw);
    box(sx, sy, sw, 16, [34, 38, 46]); // hull
    box(sx + 4, sy + 16, sw - 8, 5, PAL.red); // waterline
    box(sx + 8, sy - 14, 18, 14, [120, 60, 44]); // deck block
    box(sx + 30, sy - 14, 18, 14, [64, 96, 140]);
    // flames above the deck
    tri(sx + 10, sy - 14, sx + 18, sy - 44, sx + 26, sy - 14, PAL.orange);
    tri(sx + 30, sy - 14, sx + 38, sy - 36, sx + 46, sy - 14, PAL.yellow);
    // smoke plume
    disc(sx + 18, sy - 48, 9, PAL.smoke);
    disc(sx + 30, sy - 60, 11, [140, 142, 148]);
    disc(sx + 44, sy - 50, 8, [160, 162, 168]);
  }
  // a spiked naval mine floating in the foreground
  const mx = x + Math.floor(w * 0.50), my = y + Math.floor(h * 0.84);
  disc(mx, my, 12, [24, 26, 30]);
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    seg(mx + Math.floor(Math.cos(ang) * 10), my + Math.floor(Math.sin(ang) * 10),
        mx + Math.floor(Math.cos(ang) * 18), my + Math.floor(Math.sin(ang) * 18), [24, 26, 30], 3);
  }
  // wave marks
  for (let i = 0; i < 3; i++)
    seg(x + 14 + i * 96, y + h - 12, x + 44 + i * 96, y + h - 12, [140, 160, 180], 2);
}

// 2. Nvidia rebound: a chart panel with a steep rising line, a big
// green arrow up, and a "+31%" tag — the market's best day since 2003.
function sceneNvidia(x, y, w, h) {
  box(x, y, w, h, [238, 240, 244]); // pale chart board
  // grid
  for (let i = 1; i < 4; i++) hbar(x + 12, x + w - 12, y + Math.floor(h * i / 4), PAL.edge, 1);
  for (let i = 1; i < 5; i++) vbar(x + Math.floor(w * i / 5), y + 10, y + h - 10, PAL.edge, 1);
  // rising line: low left, high right
  const pts = [
    [0.06, 0.84], [0.20, 0.76], [0.30, 0.80], [0.44, 0.58],
    [0.58, 0.62], [0.70, 0.42], [0.82, 0.30], [0.94, 0.16],
  ];
  for (let i = 0; i < pts.length - 1; i++)
    seg(x + Math.floor(w * pts[i][0]), y + Math.floor(h * pts[i][1]),
        x + Math.floor(w * pts[i + 1][0]), y + Math.floor(h * pts[i + 1][1]), PAL.green, 5);
  for (const [fx, fy] of pts) disc(x + Math.floor(w * fx), y + Math.floor(h * fy), 4, PAL.green);
  // big up arrow
  const ax = x + Math.floor(w * 0.74), ay = y + Math.floor(h * 0.44);
  seg(ax, ay + 52, ax, ay, PAL.green, 8);
  tri(ax - 16, ay + 12, ax + 16, ay + 12, ax, ay - 20, PAL.green);
  // green "+31%" tag
  box(x + Math.floor(w * 0.08), y + Math.floor(h * 0.74), 72, 26, PAL.green);
  putText(x + Math.floor(w * 0.08) + 8, y + Math.floor(h * 0.74) + 6, '+31%', 2, PAL.white);
}

// 3. Sanctions: a bank building cut off by a red bar, a dollar coin
// stamped with a red cross, and a chain of front-company boxes broken.
function sceneSanctions(x, y, w, h) {
  box(x, y, w, h, [226, 230, 236]); // cold grey
  // bank building, centre
  const bx = x + Math.floor(w * 0.28), by = y + Math.floor(h * 0.30);
  box(bx, by, Math.floor(w * 0.44), Math.floor(h * 0.46), [96, 104, 120]);
  tri(bx - 8, by, bx + Math.floor(w * 0.22), by - 26, bx + Math.floor(w * 0.44) + 8, by, [70, 78, 94]);
  for (let c = 0; c < 4; c++)
    box(bx + 12 + c * 34, by + 16, 16, Math.floor(h * 0.30), [52, 60, 74]);
  box(x, y + Math.floor(h * 0.76), w, 10, [70, 78, 94]);
  // red bar across the bank
  seg(x + Math.floor(w * 0.12), y + Math.floor(h * 0.62), x + Math.floor(w * 0.88), y + Math.floor(h * 0.38), PAL.red, 8);
  // dollar coin with a cross, top right
  const cx = x + Math.floor(w * 0.82), cy = y + Math.floor(h * 0.20);
  disc(cx, cy, 18, PAL.gold);
  disc(cx, cy, 12, [232, 196, 90]);
  putText(cx - 5, cy - 7, 'S', 2, [120, 90, 10]);
  seg(cx - 12, cy - 12, cx + 12, cy + 12, PAL.red, 4);
  seg(cx + 12, cy - 12, cx - 12, cy + 12, PAL.red, 4);
  // broken chain of small boxes, bottom left: the middle link is cut
  for (let i = 0; i < 3; i++) {
    const qx = x + 18 + i * 46;
    box(qx, y + Math.floor(h * 0.86), 30, 16, [150, 156, 166]);
    if (i < 2) seg(qx + 30, y + Math.floor(h * 0.86) + 8, qx + 46, y + Math.floor(h * 0.86) + 8, [150, 156, 166], 3);
  }
  const gx2 = x + 18 + 46;
  seg(gx2 + 30, y + Math.floor(h * 0.86), gx2 + 46, y + Math.floor(h * 0.86) + 16, PAL.red, 3);
  seg(gx2 + 46, y + Math.floor(h * 0.86), gx2 + 30, y + Math.floor(h * 0.86) + 16, PAL.red, 3);
}

// 4. Gaza: ruined buildings under a brown haze, a cracked water drop
// and a "99%" tag — contamination signs across almost all of the Strip.
function sceneGaza(x, y, w, h) {
  box(x, y, w, h, [214, 190, 150]); // dusty haze
  disc(x + Math.floor(w * 0.82), y + Math.floor(h * 0.18), 15, [236, 150, 60]);
  // ruined skyline
  const heights = [0.52, 0.38, 0.60, 0.44, 0.56];
  for (let i = 0; i < 5; i++) {
    const bx = x + 10 + i * Math.floor((w - 20) / 5);
    const bw = Math.floor((w - 20) / 5) - 8;
    const bh = Math.floor(h * heights[i]);
    box(bx, y + Math.floor(h * 0.84) - bh, bw, bh, [96, 92, 88]);
    tri(bx, y + Math.floor(h * 0.84) - bh, bx + Math.floor(bw / 2), y + Math.floor(h * 0.84) - bh - 14, bx + bw, y + Math.floor(h * 0.84) - bh, [72, 68, 64]);
    for (let r = 0; r < 3; r++)
      box(bx + 8, y + Math.floor(h * 0.84) - bh + 12 + r * 22, 12, 12, [52, 56, 62]);
  }
  box(x, y + Math.floor(h * 0.84), w, h - Math.floor(h * 0.84), [80, 76, 72]);
  // smoke plumes
  disc(x + Math.floor(w * 0.24), y + Math.floor(h * 0.26), 10, PAL.smoke);
  disc(x + Math.floor(w * 0.30), y + Math.floor(h * 0.18), 12, [140, 142, 148]);
  disc(x + Math.floor(w * 0.66), y + Math.floor(h * 0.30), 9, PAL.smoke);
  disc(x + Math.floor(w * 0.72), y + Math.floor(h * 0.22), 11, [150, 152, 156]);
  // cracked water drop, bottom right
  const cx = x + Math.floor(w * 0.82), cy = y + Math.floor(h * 0.72);
  tri(cx - 14, cy, cx, cy - 24, cx + 14, cy, [52, 96, 160]);
  disc(cx, cy + 2, 14, [52, 96, 160]);
  seg(cx - 8, cy - 6, cx + 8, cy + 8, [30, 60, 100], 3);
  // "99%" tag
  box(x + Math.floor(w * 0.08), y + Math.floor(h * 0.10), 76, 26, [120, 32, 32]);
  putText(x + Math.floor(w * 0.08) + 8, y + Math.floor(h * 0.10) + 6, '99%', 2, PAL.white);
}

// 5. Myanmar: scales of justice on a deep green field, five red
// sanction marks above, a gavel resting below.
function sceneMyanmar(x, y, w, h) {
  box(x, y, w, h, [28, 64, 52]); // deep green
  // five red sanction marks in a row, top
  for (let i = 0; i < 5; i++) {
    const mx = x + Math.floor(w * (0.14 + i * 0.18));
    const my = y + Math.floor(h * 0.20);
    disc(mx, my, 12, PAL.red);
    putText(mx - 4, my - 7, 'X', 2, PAL.white);
  }
  // scales of justice
  const cx = x + Math.floor(w * 0.50), cy = y + Math.floor(h * 0.52);
  vbar(cx, cy - 52, cy + 34, PAL.gold, 5);
  hbar(cx - 58, cx + 58, cy - 52, PAL.gold, 4);
  disc(cx, cy - 52, 6, PAL.gold);
  // left pan
  seg(cx - 58, cy - 52, cx - 78, cy - 8, PAL.gold, 3);
  seg(cx - 58, cy - 52, cx - 38, cy - 8, PAL.gold, 3);
  tri(cx - 78, cy - 8, cx - 38, cy - 8, cx - 58, cy + 8, PAL.gold);
  // right pan
  seg(cx + 58, cy - 52, cx + 78, cy - 8, PAL.gold, 3);
  seg(cx + 58, cy - 52, cx + 38, cy - 8, PAL.gold, 3);
  tri(cx + 38, cy - 8, cx + 78, cy - 8, cx + 58, cy + 8, PAL.gold);
  // base
  box(cx - 34, cy + 34, 68, 8, PAL.gold);
  box(cx - 22, cy + 42, 44, 6, PAL.gold);
  // gavel, bottom right
  const gx = x + Math.floor(w * 0.76), gy = y + Math.floor(h * 0.82);
  seg(gx - 20, gy - 14, gx + 20, gy + 14, [120, 90, 50], 8);
  seg(gx - 26, gy + 6, gx + 6, gy + 26, [90, 66, 36], 5);
}

// 6. Women's World Cup: a green pitch under floodlights, a football
// on the spot, a gold trophy, and a "48" tag for the expanded field.
function sceneFifa(x, y, w, h) {
  box(x, y, w, h, [22, 48, 84]); // night sky over the stadium
  // floodlight towers
  for (const fx of [0.12, 0.88]) {
    const tx = x + Math.floor(w * fx);
    vbar(tx, y + Math.floor(h * 0.10), y + Math.floor(h * 0.42), [180, 184, 190], 5);
    box(tx - 16, y + Math.floor(h * 0.06), 32, 12, PAL.white);
    for (let i = 0; i < 3; i++) disc(tx - 10 + i * 10, y + Math.floor(h * 0.06) + 6, 3, PAL.yellow);
  }
  // stands
  box(x, y + Math.floor(h * 0.42), w, Math.floor(h * 0.16), [120, 126, 134]);
  for (let i = 0; i < 12; i++)
    disc(x + 16 + i * Math.floor((w - 32) / 11), y + Math.floor(h * 0.50), 4, [200 + (i % 3) * 12, 60, 90]);
  // pitch
  box(x, y + Math.floor(h * 0.58), w, h - Math.floor(h * 0.58), [34, 132, 70]);
  hbar(x, x + w - 1, y + Math.floor(h * 0.58), PAL.white, 2);
  hbar(x, x + w - 1, y + Math.floor(h * 0.72), [120, 200, 140], 2);
  // centre circle and spot
  disc(x + Math.floor(w * 0.50), y + Math.floor(h * 0.79), 26, [34, 132, 70], false);
  disc(x + Math.floor(w * 0.50), y + Math.floor(h * 0.79), 3, PAL.white);
  // football, left
  const bx = x + Math.floor(w * 0.24), by = y + Math.floor(h * 0.80);
  disc(bx, by, 20, PAL.white);
  disc(bx, by, 20, [40, 44, 52], false);
  disc(bx, by, 6, [40, 44, 52]);
  for (let a = 0; a < 5; a++) {
    const ang = (a * Math.PI * 2) / 5;
    seg(bx + Math.floor(Math.cos(ang) * 6), by + Math.floor(Math.sin(ang) * 6),
        bx + Math.floor(Math.cos(ang) * 16), by + Math.floor(Math.sin(ang) * 16), [40, 44, 52], 2);
  }
  // gold trophy, right
  const tx = x + Math.floor(w * 0.76), ty = y + Math.floor(h * 0.70);
  box(tx - 10, ty, 20, 22, PAL.gold);
  tri(tx - 10, ty, tx - 22, ty - 12, tx - 10, ty + 4, PAL.gold);
  tri(tx + 10, ty, tx + 22, ty - 12, tx + 10, ty + 4, PAL.gold);
  box(tx - 4, ty + 22, 8, 8, PAL.gold);
  box(tx - 14, ty + 30, 28, 6, PAL.gold);
  // "48" tag
  box(x + Math.floor(w * 0.08), y + Math.floor(h * 0.10), 64, 26, PAL.navySoft);
  putText(x + Math.floor(w * 0.08) + 10, y + Math.floor(h * 0.10) + 6, '48', 2, PAL.white);
}

// ------------------------------------------------------------------ layout
paintAll(PAL.paper);

// Header band
box(0, 0, W, 150, PAL.navy);
box(0, 150, W, 4, PAL.gold);
putCentred(W / 2, 20, 'THE WORLD IN ONE PICTURE', 4, PAL.white);
putCentred(W / 2, 66, 'TUESDAY 24 NOVEMBER 2026', 3, PAL.gold);
putCentred(W / 2, 112, "THE DAY'S NEWS, IN SIX STORIES", 2, [198, 206, 222]);

const panels = [
  {
    kicker: 'HORMUZ - GULF', kickCol: PAL.teal,
    head: 'THREE TANKERS ABLAZE IN HORMUZ',
    body: "Iran says three oil tankers hit naval mines and caught fire in the Strait of Hormuz, the Revolutionary Guard reports.",
    scene: sceneHormuz,
  },
  {
    kicker: 'MARKETS - NVIDIA', kickCol: PAL.green,
    head: 'NVIDIA SOARS 31% AS HUANG RETURNS',
    body: 'Nvidia jumps 31% in its best day since 2003 as Jensen Huang returns as CEO. The Nasdaq climbs 6.5%.',
    scene: sceneNvidia,
  },
  {
    kicker: 'WASHINGTON - IRAN', kickCol: PAL.navy,
    head: 'US SANCTIONS IRAN SHADOW BANKING',
    body: 'The US Treasury sanctions 30 people and firms in Iran shadow banking networks, tracing $14.7bn of flows.',
    scene: sceneSanctions,
  },
  {
    kicker: 'GAZA - ENVIRONMENT', kickCol: [120, 32, 32],
    head: "GAZA A 'TOXIC WASTELAND', REPORT SAYS",
    body: 'Oxfam and CEOBS find signs of toxic contamination across 99% of Gaza, a danger for decades to come.',
    scene: sceneGaza,
  },
  {
    kicker: 'LONDON - MYANMAR', kickCol: [28, 64, 52],
    head: 'UK RECOGNISES ROHINGYA GENOCIDE',
    body: 'Britain formally recognises the Rohingya genocide and sanctions five Myanmar generals, with £8m in aid.',
    scene: sceneMyanmar,
  },
  {
    kicker: 'SPORT - FIFA', kickCol: PAL.navySoft,
    head: "WOMEN'S WORLD CUP HOSTS CONFIRMED",
    body: 'FIFA confirms the 2031 Women\'s World Cup for a US-led bid and the 2035 edition for the UK. 48 teams, a first.',
    scene: sceneFifa,
  },
];

const M = 14, GAP = 10;
const PW = Math.floor((W - M * 2 - GAP * 2) / 3); // 325
const PH = 400;
const TOP = 164;
for (let i = 0; i < panels.length; i++) {
  const col = i % 3, row = Math.floor(i / 3);
  const x0 = M + col * (PW + GAP);
  const y0 = TOP + row * (PH + GAP);
  const p = panels[i];
  box(x0, y0, PW, PH, PAL.card);
  hbar(x0, x0 + PW - 1, y0, PAL.grey, 2);
  hbar(x0, x0 + PW - 1, y0 + PH - 1, PAL.grey, 2);
  vbar(x0, y0, y0 + PH - 1, PAL.grey, 2);
  vbar(x0 + PW - 1, y0, y0 + PH - 1, PAL.grey, 2);
  box(x0 + 2, y0 + 2, PW - 4, 28, p.kickCol);
  putText(x0 + 12, y0 + 10, p.kicker, 2, PAL.white);
  const picY = y0 + 32, picH = 170;
  p.scene(x0 + 2, picY, PW - 4, picH);
  let ty = picY + picH + 12;
  for (const ln of wrapText(p.head, 2, PW - 24)) {
    putText(x0 + 12, ty, ln, 2, PAL.ink);
    ty += 19;
  }
  ty += 4;
  hbar(x0 + 12, x0 + PW - 12, ty, PAL.gold, 3);
  ty += 12;
  for (const ln of wrapText(p.body, 2, PW - 24)) {
    putText(x0 + 12, ty, ln, 2, PAL.body);
    ty += 19;
  }
}

// Footer
putCentred(W / 2, 988, 'SOURCES: AL JAZEERA, CNN, REUTERS, TREASURY, GOV.UK, OXFAM, FIFA - 24 NOV 2026', 2, PAL.grey);

// ------------------------------------------------------------------ PNG encode
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type RGB
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', deflateSync(raw, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('./entry.png', import.meta.url), png);
console.log('entry.png', png.length, 'bytes,', W + 'x' + H);
