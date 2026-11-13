import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { destinationsQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/destinations/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(destinationsQuery),
  head: ({ params }) => pageMeta(params.lang, { hi: "पवित्र तीर्थ स्थल", en: "Sacred Pilgrimage Destinations" }, { hi: "केदारनाथ, बद्रीनाथ, वाराणसी, अयोध्या, वृंदावन और अन्य तीर्थ स्थलों की जानकारी।", en: "Guides to Kedarnath, Badrinath, Varanasi, Ayodhya, Vrindavan and more." }),
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useSuspenseQuery(destinationsQuery);
  return (
    <>
      <PageHero title={t("dest.title")} sub={t("dest.subtitle")} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => (
          <Link key={d.id} to="/$lang/destinations/$slug" params={{ lang, slug: d.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <img src={d.image_url ?? ""} alt={loc(d, "name", lang)} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
            <div className="p-5"><h2 className="text-xl font-semibold group-hover:text-maroon">{loc(d, "name", lang)}</h2><p className="text-sm text-muted-foreground">{d.state}</p><p className="mt-2 line-clamp-2 text-[15px]">{loc(d, "description", lang)}</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}
