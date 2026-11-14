/**
 * Responsive sources for the seeded images in public/images.
 *
 * scripts/optimize-images.mjs emits three widths per image (480 / 960 / 1200) as WebP.
 * A phone rendering a card at ~300 CSS px was previously downloading the 1200px JPEG —
 * 162-318 KB where the 480w WebP is 24-49 KB.
 *
 * Anything else (admin uploads under /media, which are already WebP, or an absolute URL)
 * is returned untouched, so callers can use this for every image source.
 */
const STATIC_IMAGE = /^\/images\/([a-z0-9-]+)\.(?:jpe?g|webp)$/i;

export type ImgSources = { src: string; srcSet?: string; sizes?: string };

/**
 * @param sizes CSS `sizes` describing the rendered width, e.g. "(min-width: 768px) 33vw, 100vw".
 *              Required for the browser to pick correctly before layout.
 */
export function imgSources(url: string | null | undefined, sizes: string): ImgSources {
  const src = url ?? "";
  const match = STATIC_IMAGE.exec(src);
  if (!match) return { src };
  // Legacy .jpg values seeded into the database resolve to the WebP derivative too,
  // so no data migration is needed to benefit from this.
  const base = `/images/${match[1]}`;
  return {
    src: `${base}.webp`,
    srcSet: `${base}-480.webp 480w, ${base}-960.webp 960w, ${base}.webp 1200w`,
    sizes,
  };
}
