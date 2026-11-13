import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { categoriesQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/types/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  head: ({ params }) => pageMeta(params.lang, { hi: "यात्रा प्रकार", en: "Yatra Types" }, { hi: "चार धाम, ज्योतिर्लिंग, शक्ति पीठ, ब्रज, दक्षिण भारत और अन्य श्रेणियाँ।", en: "Char Dham, Jyotirlinga, Shakti Peeth, Braj, South India and more categories." }),
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useSuspenseQuery(categoriesQuery);
  return (
    <>
      <PageHero title={t("types.title")} sub={t("types.subtitle")} />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((c) => (
          <Link key={c.id} to="/$lang/types/$slug" params={{ lang, slug: c.slug }} className="group relative overflow-hidden rounded-2xl">
            <img src={c.image_url ?? ""} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
            <div className="absolute inset-0 bg-hero-overlay" />
            <div className="absolute bottom-4 left-4 text-maroon-foreground"><div className="text-xl font-semibold">{loc(c, "name", lang)}</div><div className="text-sm opacity-90">{(c.yatra_categories as unknown as { count: number }[])?.[0]?.count ?? 0} {t("nav.yatras")}</div></div>
          </Link>
        ))}
      </div>
    </>
  );
}
