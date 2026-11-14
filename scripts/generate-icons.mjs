// Rasterises public/icon.svg into the PNG icons iOS and Android need.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync, statSync } from "node:fs";

const SVG = readFileSync("public/icon.svg");
const OUT = [
  ["public/apple-touch-icon.png", 180], // iOS home screen
  ["public/icon-192.png", 192], // Android / manifest
  ["public/icon-512.png", 512], // Android splash / manifest
  ["public/favicon-32.png", 32], // desktop tab fallback
];

for (const [path, size] of OUT) {
  await sharp(SVG, { density: 384 }).resize(size, size).png().toFile(path);
  console.log(`${path} ${size}x${size} ${(statSync(path).size / 1024).toFixed(1)}KB`);
}
