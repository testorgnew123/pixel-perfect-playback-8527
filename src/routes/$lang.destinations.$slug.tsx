import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { destinationQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { PageHero, RouteError, RouteNotFound, SectionHeading, YatraCard } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/destinations/$slug")({
  loader: async ({ context, params }) => { const d = await context.queryClient.ensureQueryData(destinationQuery(params.slug)); if (!d) throw notFound(); return d; },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Destination" }, { name: "robots", content: "noindex" }] };
    const hi = params.lang !== "en"; const name = (hi ? loaderData.name_hi : null) || loaderData.name_en;
    const desc = ((hi ? loaderData.description_hi : null) || loaderData.description_en) ?? "";
    return { meta: [{ title: `${name} | ${hi ? "तीर्थ दर्शन यात्रा" : "Tirth Darshan Yatra"}` }, { name: "description", content: desc }, { property: "og:title", content: name }, { property: "og:description", content: desc }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
  notFoundComponent: () => <RouteNotFound />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { slug } = Route.useParams();
  const d = useSuspenseQuery(destinationQuery(slug)).data!;
  const name = loc(d, "name", lang);
  const info = [["bestTime", "best_time"], ["significance", "significance"], ["howToReach", "how_to_reach"], ["nearby", "nearby"]] as const;
  return (
    <>
      <PageHero title={name} sub={d.state ?? ""} image={d.image_url} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="max-w-3xl text-lg">{loc(d, "description", lang)}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {info.map(([k, f]) => <div key={k} className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold text-maroon">{t(`dest.${k}`)}</h2><p className="mt-1">{loc(d, f, lang)}</p></div>)}
        </div>
        {d.yatras.length > 0 && <section className="mt-12"><SectionHeading title={t("dest.yatrasHere", { name })} /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{d.yatras.map((y) => <YatraCard key={y.id} y={y} />)}</div></section>}
      </div>
    </>
  );
}
