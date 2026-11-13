import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoriesQuery, departuresQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { departureStatus, formatDate, formatINR, loc, monthLabel, seatsLeft } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError, StatusBadge } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/departures")({
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(departuresQuery), context.queryClient.ensureQueryData(categoriesQuery)]); },
  head: ({ params }) => pageMeta(params.lang, { hi: "आगामी यात्रा प्रस्थान तिथियाँ", en: "Upcoming Yatra Departures" }, { hi: "सभी तीर्थ यात्राओं की आने वाली तिथियाँ और शेष सीटें देखें।", en: "See all upcoming group departure dates with live seats left." }),
  component: DeparturesPage,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function DeparturesPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: deps } = useSuspenseQuery(departuresQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [type, setType] = useState("");
  const [month, setMonth] = useState("");
  const filtered = deps.filter((d) => (!type || d.categorySlugs.includes(type)) && (!month || d.start_date.slice(0, 7) === month));
  const monthsAvail = Array.from(new Set(deps.map((d) => d.start_date.slice(0, 7))));
  const groups = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const d of filtered) { const k = d.start_date.slice(0, 7); m.set(k, [...(m.get(k) ?? []), d]); }
    return [...m.entries()];
  }, [filtered]);
  const ml = (k: string) => `${monthLabel(Number(k.slice(5, 7)), lang)} ${k.slice(0, 4)}`;

  return (
    <>
      <PageHero title={t("departures.title")} sub={t("departures.subtitle")} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-lg border border-input bg-card px-3" aria-label={t("listing.type")}>
            <option value="">{t("departures.allTypes")}</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{loc(c, "name", lang)}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="h-11 rounded-lg border border-input bg-card px-3" aria-label={t("listing.month")}>
            <option value="">{t("departures.allMonths")}</option>
            {monthsAvail.map((k) => <option key={k} value={k}>{ml(k)}</option>)}
          </select>
          <div className="ml-auto flex gap-2">
            <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}><List className="h-4 w-4" />{t("departures.list")}</Button>
            <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}><CalendarDays className="h-4 w-4" />{t("departures.calendar")}</Button>
          </div>
        </div>

        {groups.map(([k, list]) => (
          <section key={k} className="mb-10">
            <h2 className="mb-4 font-display text-2xl text-maroon">{ml(k)}</h2>
            {view === "list" ? (
              <div className="space-y-3">
                {list.map((d) => {
                  const left = seatsLeft(d); const st = departureStatus(d);
                  return (
                    <div key={d.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
                      <img src={d.yatra?.cover_image ?? ""} alt="" loading="lazy" className="h-20 w-full rounded-xl object-cover sm:w-28" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-primary">{formatDate(d.start_date, lang)} – {formatDate(d.end_date, lang)}</div>
                        <Link to="/$lang/yatras/$slug" params={{ lang, slug: d.yatra!.slug }} className="text-lg font-semibold hover:text-maroon">{loc(d.yatra, "title", lang)}</Link>
                        <div className="text-sm text-muted-foreground">{t("common.daysNights", { d: d.yatra?.duration_days, n: d.yatra?.duration_nights })}</div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                        <span className={`text-sm ${left < 10 ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{t("common.seatsLeftPlain", { count: left })}</span>
                        <StatusBadge status={st} />
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <span className="text-xl font-bold text-maroon">{formatINR(d.price_override ?? d.yatra?.price)}</span>
                        <Button asChild size="sm" className="rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90"><Link to="/$lang/yatras/$slug" params={{ lang, slug: d.yatra!.slug }} hash="departures">{t("common.bookNow")}</Link></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <MonthGrid monthKey={k} list={list} />
            )}
          </section>
        ))}
        {groups.length === 0 && <p className="py-12 text-center text-muted-foreground">{t("departures.none")}</p>}
      </div>
    </>
  );
}

function MonthGrid({ monthKey, list }: { monthKey: string; list: { id: string; start_date: string; yatra: { slug: string; title_en: string; title_hi: string | null } | null }[] }) {
  const lang = useLang();
  const y = Number(monthKey.slice(0, 4)), m = Number(monthKey.slice(5, 7));
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const wd = lang === "hi" ? ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="grid grid-cols-7 gap-1 rounded-2xl border border-border bg-card p-2 text-sm">
      {wd.map((w) => <div key={w} className="py-1 text-center font-semibold text-muted-foreground">{w}</div>)}
      {cells.map((d, i) => {
        const items = d ? list.filter((x) => Number(x.start_date.slice(8, 10)) === d) : [];
        return (
          <div key={i} className={`min-h-20 rounded-lg p-1 ${d ? "bg-background" : ""}`}>
            {d && <div className="text-xs text-muted-foreground">{d}</div>}
            {items.map((x) => <Link key={x.id} to="/$lang/yatras/$slug" params={{ lang, slug: x.yatra!.slug }} className="mt-0.5 block truncate rounded bg-primary/20 px-1 text-xs font-medium text-maroon hover:bg-primary/40">{loc(x.yatra, "title", lang)}</Link>)}
          </div>
        );
      })}
    </div>
  );
}
