import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { categoryQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { BRAND, DEFAULT_OG_IMAGE, absUrl, breadcrumbLd, toLang } from "@/lib/seo";
import { PageHero, RouteError, RouteNotFound } from "@/components/site/ui";
import { YatraCard } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/types/$slug")({
  loader: async ({ context, params }) => { const c = await context.queryClient.ensureQueryData(categoryQuery(params.slug)); if (!c) throw notFound(); return c; },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Yatra type" }, { name: "robots", content: "noindex" }] };
    const hi = params.lang !== "en"; const lang = toLang(params.lang);
    const name = (hi ? loaderData.name_hi : null) || loaderData.name_en;
    // Prefer the category's own description; the generated line is a last resort, since the
    // same template across 12 categories reads as 12 near-duplicate meta descriptions.
    const own = ((hi ? loaderData.description_hi : null) || loaderData.description_en) ?? "";
    const desc = own || (hi ? `${name} – सभी यात्राएँ और प्रस्थान तिथियाँ` : `${name} – all yatras and departure dates`);
    const title = `${name} | ${BRAND[lang]}`;
    const img = absUrl(loaderData.image_url || DEFAULT_OG_IMAGE);
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      scripts: [
        breadcrumbLd([
          { name: hi ? "होम" : "Home", path: `/${lang}` },
          { name: hi ? "यात्रा प्रकार" : "Yatra Types", path: `/${lang}/types` },
          { name, path: `/${lang}/types/${loaderData.slug}` },
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
  const c = useSuspenseQuery(categoryQuery(slug)).data!;
  return (
    <>
      <PageHero title={loc(c, "name", lang)} sub={t("listing.found", { count: c.yatras.length })} image={c.image_url} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {c.yatras.map((y) => <YatraCard key={y.id} y={y} />)}
        {c.yatras.length === 0 && <p className="text-muted-foreground">{t("listing.empty")}</p>}
      </div>
    </>
  );
}
