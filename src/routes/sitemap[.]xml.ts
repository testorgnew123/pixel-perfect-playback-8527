import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { blog_posts, categories, destinations, yatras } from "../../drizzle/schema";
import { LANGS } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

// Paths that exist under both /hi and /en. Deliberately excludes login, account, book and
// booking: those are noindex, so listing them here would contradict their own meta robots.
const STATIC_PATHS = [
  "",
  "/yatras",
  "/destinations",
  "/types",
  "/departures",
  "/blog",
  "/about",
  "/team",
  "/gallery",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/cancellation-policy",
] as const;

type Entry = { path: string; lastmod?: string | null; changefreq: string; priority: string };

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const iso = (d: Date | string | null | undefined) => {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

/** One <url> per language, each carrying the full xhtml:link alternate set. */
function urlBlock(entry: Entry) {
  return LANGS.map((lang) => {
    const loc = `${SITE_URL}/${lang}${entry.path}`;
    const alternates = [
      ...LANGS.map((l) => ({ hreflang: l as string, href: `${SITE_URL}/${l}${entry.path}` })),
      { hreflang: "x-default", href: `${SITE_URL}/hi${entry.path}` },
    ]
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(a.href)}"/>`)
      .join("\n");
    return [
      "  <url>",
      `    <loc>${xmlEscape(loc)}</loc>`,
      alternates,
      entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  }).join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);

        // Every query keeps its own published filter — that filter is the only security
        // boundary on public reads, so unpublished rows must never reach the sitemap.
        const [yatraRows, destRows, catRows, blogRows] = await Promise.all([
          db.query.yatras.findMany({
            where: eq(yatras.status, "published"),
            columns: { slug: true, updated_at: true },
            orderBy: asc(yatras.slug),
          }),
          db.query.destinations.findMany({
            where: eq(destinations.is_published, true),
            columns: { slug: true, created_at: true },
            orderBy: asc(destinations.sort_order),
          }),
          db.query.categories.findMany({
            where: eq(categories.is_published, true),
            columns: { slug: true, created_at: true },
            orderBy: asc(categories.sort_order),
          }),
          db.query.blog_posts.findMany({
            where: and(
              eq(blog_posts.is_published, true),
              isNotNull(blog_posts.published_at),
              lte(blog_posts.published_at, new Date()),
            ),
            columns: { slug: true, updated_at: true },
            orderBy: asc(blog_posts.slug),
          }),
        ]);

        const entries: Entry[] = [
          ...STATIC_PATHS.map((p) => ({
            path: p,
            lastmod: today,
            changefreq: p === "" || p === "/departures" ? "daily" : "weekly",
            priority: p === "" ? "1.0" : p === "/yatras" || p === "/departures" ? "0.9" : "0.6",
          })),
          ...yatraRows.map((r) => ({
            path: `/yatras/${r.slug}`,
            lastmod: iso(r.updated_at),
            changefreq: "weekly",
            priority: "0.9",
          })),
          ...destRows.map((r) => ({
            path: `/destinations/${r.slug}`,
            lastmod: iso(r.created_at),
            changefreq: "monthly",
            priority: "0.7",
          })),
          ...catRows.map((r) => ({
            path: `/types/${r.slug}`,
            lastmod: iso(r.created_at),
            changefreq: "monthly",
            priority: "0.7",
          })),
          ...blogRows.map((r) => ({
            path: `/blog/${r.slug}`,
            lastmod: iso(r.updated_at),
            changefreq: "monthly",
            priority: "0.5",
          })),
        ];

        const body = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...entries.map(urlBlock),
          "</urlset>",
        ].join("\n");

        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
