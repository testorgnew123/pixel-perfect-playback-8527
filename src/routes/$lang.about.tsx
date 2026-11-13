import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLang, useSettings } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { Counter, PageHero } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/about")({
  head: ({ params }) => pageMeta(params.lang, { hi: "हमारे बारे में", en: "About Us" }, { hi: "15 वर्षों से श्रद्धा और सेवा के साथ तीर्थ यात्राएँ।", en: "15 years of guiding pilgrimages with devotion and care." }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const values = t("about.values", { returnObjects: true }) as string[];
  const c = (s.counters ?? {}) as Record<string, number>;
  return (
    <>
      <PageHero title={t("about.title")} image="/images/varanasi.jpg" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-2">
        <div><p className="text-lg">{loc(s, "about", lang)}</p><h2 className="mt-8 font-display text-2xl text-maroon">{t("about.mission")}</h2><p className="mt-2 text-lg">{t("about.missionText")}</p></div>
        <div className="grid grid-cols-2 gap-4">{values.map((v) => <div key={v} className="grid place-items-center rounded-2xl bg-mandala p-8 text-center text-xl font-semibold text-maroon">{v}</div>)}</div>
      </div>
      <section className="bg-gradient-maroon py-12"><div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
        <Counter value={c["yatras"] ?? 500} label={t("home.counters.yatras")} /><Counter value={c["places"] ?? 150} label={t("home.counters.places")} /><Counter value={c["years"] ?? 15} label={t("home.counters.years")} /><Counter value={c["yatris"] ?? 25000} label={t("home.counters.yatris")} />
      </div></section>
    </>
  );
}
