// Regenerates WebP derivatives for the seeded images in public/images.
// Run with: node scripts/optimize-images.mjs
//
// Produces, per source JPEG:
//   name.webp       full size, for heroes and large art
//   name-960.webp   tablet / large card
//   name-480.webp   phone card
// Admin-uploaded media is already WebP (src/lib/admin-client.ts), so this only covers
// the static seed images.
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";

const DIR = "public/images";
const WIDTHS = [480, 960];
// Every image tops out at 1200 so the srcset ladder is identical for all of them
// (480w / 960w / 1200w). The layout is max-w-7xl, so nothing is displayed wider.
const MAX_WIDTH = 1200;
const QUALITY = 78;

let before = 0;
let after = 0;

for (const file of readdirSync(DIR).filter((n) => n.endsWith(".jpg"))) {
  const src = `${DIR}/${file}`;
  const base = file.replace(/\.jpg$/, "");
  before += statSync(src).size;

  const meta = await sharp(src).metadata();
  await sharp(src).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(`${DIR}/${base}.webp`);
  const fullSize = statSync(`${DIR}/${base}.webp`).size;
  after += fullSize;

  const outW = Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH);
  const parts = [`${base}.webp ${outW}w ${(fullSize / 1024).toFixed(0)}KB (from ${meta.width}w)`];
  for (const w of WIDTHS) {
    if ((meta.width ?? 0) <= w) continue;
    await sharp(src).resize({ width: w }).webp({ quality: QUALITY }).toFile(`${DIR}/${base}-${w}.webp`);
    parts.push(`${w}w ${(statSync(`${DIR}/${base}-${w}.webp`).size / 1024).toFixed(0)}KB`);
  }
  console.log(parts.join("  |  "));
}

console.log(
  `\nfull-size set: ${(before / 1024 / 1024).toFixed(2)} MB JPEG -> ${(after / 1024 / 1024).toFixed(2)} MB WebP (${Math.round((1 - after / before) * 100)}% smaller)`,
);
