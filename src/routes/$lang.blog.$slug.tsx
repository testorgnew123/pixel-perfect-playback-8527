import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Share2 } from "lucide-react";
import { blogPostQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { formatDate, loc, waHref } from "@/lib/format";
import { BRAND, DEFAULT_OG_IMAGE, SITE_URL, absUrl, breadcrumbLd, ldScript, toLang } from "@/lib/seo";
import { RouteError, RouteNotFound, SectionHeading } from "@/components/site/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$lang/blog/$slug")({
  loader: async ({ context, params }) => { const p = await context.queryClient.ensureQueryData(blogPostQuery(params.slug)); if (!p) throw notFound(); return p; },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Article" }, { name: "robots", content: "noindex" }] };
    const hi = params.lang !== "en"; const lang = toLang(params.lang);
    const title = (hi ? loaderData.title_hi : null) || loaderData.title_en;
    const desc = ((hi ? loaderData.excerpt_hi : null) || loaderData.excerpt_en) ?? "";
    const img = absUrl(loaderData.cover_image || DEFAULT_OG_IMAGE);
    const url = absUrl(`/${lang}/blog/${loaderData.slug}`);
    const published = loaderData.published_at ? new Date(loaderData.published_at).toISOString() : null;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      scripts: [
        ldScript({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description: desc,
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          image: img,
          inLanguage: hi ? "hi-IN" : "en-IN",
          ...(published ? { datePublished: published } : {}),
          ...(loaderData.updated_at ? { dateModified: new Date(loaderData.updated_at).toISOString() } : {}),
          ...(loaderData.author ? { author: { "@type": "Person", name: loaderData.author } } : {}),
          publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: BRAND[lang] },
        }),
        breadcrumbLd([
          { name: hi ? "होम" : "Home", path: `/${lang}` },
          { name: hi ? "ब्लॉग" : "Blog", path: `/${lang}/blog` },
          { name: title, path: `/${lang}/blog/${loaderData.slug}` },
        ]),
      ],
    };
  },
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
  notFoundComponent: () => <RouteNotFound />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { slug } = Route.useParams();
  const p = useSuspenseQuery(blogPostQuery(slug)).data!;
  const title = loc(p, "title", lang);
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-sm text-muted-foreground">{p.category} · {formatDate(p.published_at, lang)} · {t("blog.by", { a: p.author })}</div>
      <h1 className="mt-2 font-display text-4xl text-maroon">{title}</h1>
      <img src={p.cover_image ?? ""} alt="" className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover" />
      <div className="mt-6 whitespace-pre-line text-lg leading-relaxed">{loc(p, "content", lang)}</div>
      <Button asChild variant="outline" className="mt-6"><a href={waHref("", title)} target="_blank" rel="noreferrer"><Share2 className="h-4 w-4" />{t("common.share")}</a></Button>
      {p.related.length > 0 && (
        <section className="mt-12"><SectionHeading title={t("blog.related")} />
          <div className="grid gap-4 sm:grid-cols-3">{p.related.map((r) => <Link key={r.id} to="/$lang/blog/$slug" params={{ lang, slug: r.slug }} className="rounded-xl border border-border bg-card p-3 hover:border-primary"><img src={r.cover_image ?? ""} alt="" loading="lazy" className="aspect-video w-full rounded-lg object-cover" /><div className="mt-2 font-semibold">{loc(r, "title", lang)}</div></Link>)}</div>
        </section>
      )}
    </article>
  );
}
