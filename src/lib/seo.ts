import type { Lang } from "./i18n";

const BRAND = { hi: "तीर्थ दर्शन यात्रा", en: "Tirth Darshan Yatra" };

/** Builds per-page bilingual meta tags. */
export function pageMeta(lang: string | undefined, t: { hi: string; en: string }, d: { hi: string; en: string }, image?: string | null) {
  const l: Lang = lang === "en" ? "en" : "hi";
  const title = `${t[l]} | ${BRAND[l]}`;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: d[l] },
    { property: "og:title", content: title },
    { property: "og:description", content: d[l] },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: l === "hi" ? "hi_IN" : "en_IN" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (image && image.startsWith("https://")) {
    meta.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
  }
  return { meta };
}
