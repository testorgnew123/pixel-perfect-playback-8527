import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { teamQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/team")({
  loader: ({ context }) => context.queryClient.ensureQueryData(teamQuery),
  head: ({ params }) => pageMeta(params.lang, { hi: "हमारी टीम", en: "Our Team" }, { hi: "अनुभवी टूर मैनेजर और यात्रा विशेषज्ञ।", en: "Experienced tour managers and yatra experts." }),
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useSuspenseQuery(teamQuery);
  return (
    <>
      <PageHero title={t("team.title")} sub={t("team.subtitle")} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
            {m.photo_url ? <img src={m.photo_url} alt={m.name} className="mx-auto h-24 w-24 rounded-full object-cover" /> : <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-saffron font-display text-3xl text-maroon">{m.name.replace("Shri ", "")[0]}</div>}
            <h2 className="mt-4 text-lg font-semibold">{m.name}</h2><p className="text-sm font-medium text-primary">{loc(m, "role", lang)}</p><p className="mt-2 text-[15px] text-muted-foreground">{loc(m, "bio", lang)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
