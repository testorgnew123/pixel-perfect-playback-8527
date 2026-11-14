import type { Lang } from "./i18n";

export const BRAND = { hi: "हरि शिव शंकर तीर्थ यात्रा", en: "Hari Shiv Shankar Tirth Yatra" };

// Canonical, og:url, hreflang and the sitemap all need fully-qualified URLs: Google ignores
// relative hreflang, and a relative canonical is resolved per-host. Override per environment
// with VITE_SITE_URL (vite.config.ts only exposes VITE_-prefixed vars).
const DEFAULT_SITE_URL = "https://harishivshankar.com";
export const SITE_URL = (
  (import.meta.env["VITE_SITE_URL"] as string | undefined) || DEFAULT_SITE_URL
).replace(/\/+$/, "");

/** Absolutises a site path; passes through URLs that are already absolute. */
export const absUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Social preview fallback. TODO: replace with a purpose-built 1200x630 branded card —
 * this is a landscape photo standing in so that no page ships a bare summary_large_image.
 */
export const DEFAULT_OG_IMAGE = "/images/kedarnath.jpg";

export const toLang = (lang: string | undefined): Lang => (lang === "en" ? "en" : "hi");

/** Strips the trailing slash so /hi/ and /hi don't canonicalise to two URLs. */
export const cleanPath = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

/** Swaps the language segment of a path: /hi/yatras/x -> /en/yatras/x */
export const pathForLang = (pathname: string, lang: Lang) =>
  `/${lang}${cleanPath(pathname).replace(/^\/(hi|en)(?=\/|$)/, "")}`;

/** A JSON-LD block in the shape TanStack's head({ scripts }) expects. */
export const ldScript = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data),
});

/** Builds per-page bilingual meta tags. */
export function pageMeta(
  lang: string | undefined,
  t: { hi: string; en: string },
  d: { hi: string; en: string },
  image?: string | null,
) {
  const l = toLang(lang);
  const title = `${t[l]} | ${BRAND[l]}`;
  const description = d[l];
  // Any site path works here, not just https:// — DB images are same-origin (/media, /images),
  // so the old startsWith("https://") gate silently dropped every one of them.
  const img = absUrl(image || DEFAULT_OG_IMAGE);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: l === "hi" ? "hi_IN" : "en_IN" },
      { property: "og:site_name", content: BRAND[l] },
      { property: "og:image", content: img },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
  };
}

type Crumb = { name: string; path: string };

/** BreadcrumbList for a detail page. Paths are site-relative and absolutised here. */
export const breadcrumbLd = (items: Crumb[]) =>
  ldScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  });
