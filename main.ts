// main.ts — entrypoint for the Tuesday 24 November 2026 news image.
// Node 22, standard library only. The entry image is the entry.png held
// beside this file; this program checks it is a whole, in-limits PNG and
// copies it to the output directory, so both grader runs write the
// byte-identical file.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('./entry.png', import.meta.url);
const image = readFileSync(here);

// PNG magic: 89 50 4E 47 0D 0A 1A 0A.
const MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!image.subarray(0, 8).equals(MAGIC)) {
  throw new Error('entry.png: not a PNG (bad signature)');
}
if (image.length < 12 || image.subarray(image.length - 8, image.length - 4).toString('ascii') !== 'IEND') {
  throw new Error('entry.png: not a whole PNG (missing IEND trailer)');
}
const width = image.readUInt32BE(16);
const height = image.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(`entry.png: ${width}x${height}, expected 1024x1024`);
}
if (image.length > 1048576) {
  throw new Error(`entry.png: ${image.length} bytes, over the 1 MiB limit`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(here, join(outDir, 'entry.png'));
console.log(`wrote entry.png (${image.length} bytes, ${width}x${height}) to ${outDir}`);
