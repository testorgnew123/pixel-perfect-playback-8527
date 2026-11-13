import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { filterOptionsQuery, yatrasQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { formatINR, loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError, YatraCard } from "@/components/site/ui";

type Search = {
  q?: string; type?: string; dest?: string; month?: number; dur?: string; budget?: number;
  transport?: string; diff?: string; senior?: boolean; sort?: string; page?: number;
};
const str = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 80) : undefined);
const num = (v: unknown) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

export const Route = createFileRoute("/$lang/yatras/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: str(s["q"]), type: str(s["type"]), dest: str(s["dest"]), month: num(s["month"]), dur: str(s["dur"]),
    budget: num(s["budget"]), transport: str(s["transport"]), diff: str(s["diff"]),
    senior: s["senior"] === true || s["senior"] === "true" ? true : undefined, sort: str(s["sort"]), page: num(s["page"]),
  }),
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(yatrasQuery), context.queryClient.ensureQueryData(filterOptionsQuery)]);
  },
  head: ({ params }) => pageMeta(params.lang, { hi: "सभी तीर्थ यात्राएँ", en: "All Pilgrimage Yatras" }, { hi: "प्रकार, महीना, बजट और अवधि के अनुसार तीर्थ यात्राएँ खोजें।", en: "Browse pilgrimage tours by type, month, budget and duration." }),
  component: YatrasPage,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

const PER_PAGE = 9;
const DUR: Record<string, [number, number]> = { "1_5": [1, 5], "6_10": [6, 10], "11_20": [11, 20], "20p": [21, 999] };

function YatrasPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: all } = useSuspenseQuery(yatrasQuery);
  const { data: opts } = useSuspenseQuery(filterOptionsQuery);
  const maxPrice = Math.max(...all.map((y) => Number(y.price ?? 0)), 50000);

  const set = (patch: Partial<Search>) => void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), replace: true });

  const filtered = useMemo(() => {
    const q = search.q?.toLowerCase();
    let r = all.filter((y) => {
      if (q && !`${y.title_en} ${y.title_hi ?? ""} ${y.states.join(" ")} ${y.destinationSlugs.join(" ")}`.toLowerCase().includes(q)) return false;
      if (search.type && !y.categorySlugs.includes(search.type)) return false;
      if (search.dest && !y.destinationSlugs.includes(search.dest)) return false;
      if (search.month && !y.months.includes(search.month)) return false;
      if (search.dur) { const rg = DUR[search.dur]; if (rg && (y.duration_days < rg[0] || y.duration_days > rg[1])) return false; }
      if (search.budget && Number(y.price ?? 0) > search.budget) return false;
      if (search.transport && !y.transport.includes(search.transport)) return false;
      if (search.diff && y.difficulty !== search.diff) return false;
      if (search.senior && !y.senior_friendly) return false;
      return true;
    });
    const sort = search.sort ?? "upcoming";
    r = [...r].sort((a, b) => {
      if (sort === "price_asc") return Number(a.price) - Number(b.price);
      if (sort === "price_desc") return Number(b.price) - Number(a.price);
      if (sort === "duration") return a.duration_days - b.duration_days;
      if (sort === "popular") return b.popularity - a.popularity;
      return (a.nextDate ?? "9999").localeCompare(b.nextDate ?? "9999");
    });
    return r;
  }, [all, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(search.page ?? 1, pages);
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const months = t("months", { returnObjects: true }) as string[];

  const Radio = ({ name, value, label, current, onPick }: { name: string; value: string | undefined; label: string; current: string | undefined; onPick: (v: string | undefined) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[15px]">
      <input type="radio" name={name} checked={current === value} onChange={() => onPick(value)} className="h-5 w-5 accent-[var(--maroon)]" />{label}
    </label>
  );

  const filters = (
    <div className="space-y-6">
      <Group title={t("listing.type")}>
        <Radio name="type" value={undefined} current={search.type} label={t("listing.all")} onPick={(v) => set({ type: v })} />
        {opts.categories.map((c) => <Radio key={c.slug} name="type" value={c.slug} current={search.type} label={loc(c, "name", lang)} onPick={(v) => set({ type: v })} />)}
      </Group>
      <Group title={t("listing.destination")}>
        <select value={search.dest ?? ""} onChange={(e) => set({ dest: e.target.value || undefined })} className="h-12 w-full rounded-lg border border-input bg-card px-3">
          <option value="">{t("listing.all")}</option>
          {opts.destinations.map((d) => <option key={d.slug} value={d.slug}>{loc(d, "name", lang)} ({d.state})</option>)}
        </select>
      </Group>
      <Group title={t("listing.month")}>
        <select value={search.month ?? ""} onChange={(e) => set({ month: e.target.value ? Number(e.target.value) : undefined })} className="h-12 w-full rounded-lg border border-input bg-card px-3">
          <option value="">{t("listing.all")}</option>
          {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </Group>
      <Group title={t("listing.duration")}>
        <Radio name="dur" value={undefined} current={search.dur} label={t("listing.all")} onPick={(v) => set({ dur: v })} />
        {Object.keys(DUR).map((k) => <Radio key={k} name="dur" value={k} current={search.dur} label={t(`listing.dur.${k}`)} onPick={(v) => set({ dur: v })} />)}
      </Group>
      <Group title={`${t("listing.budget")}: ${formatINR(search.budget ?? maxPrice)}`}>
        <Slider min={5000} max={maxPrice} step={1000} value={[search.budget ?? maxPrice]} onValueCommit={(v) => set({ budget: v[0] === maxPrice ? undefined : v[0] })} className="py-3" />
      </Group>
      <Group title={t("listing.transport")}>
        <Radio name="tr" value={undefined} current={search.transport} label={t("listing.all")} onPick={(v) => set({ transport: v })} />
        {["Train", "Bus", "Flight", "Helicopter"].map((k) => <Radio key={k} name="tr" value={k} current={search.transport} label={t(`listing.tr.${k}`)} onPick={(v) => set({ transport: v })} />)}
      </Group>
      <Group title={t("listing.difficulty")}>
        <Radio name="diff" value={undefined} current={search.diff} label={t("listing.all")} onPick={(v) => set({ diff: v })} />
        {["easy", "moderate", "difficult"].map((k) => <Radio key={k} name="diff" value={k} current={search.diff} label={t(`listing.diff.${k}`)} onPick={(v) => set({ diff: v })} />)}
      </Group>
      <label className="flex items-center gap-3 text-[15px] font-medium">
        <Checkbox checked={!!search.senior} onCheckedChange={(c) => set({ senior: c === true ? true : undefined })} className="h-5 w-5" />{t("listing.senior")}
      </label>
      <Button variant="outline" className="w-full" onClick={() => void navigate({ search: {}, replace: true })}>{t("common.clear")}</Button>
    </div>
  );

  return (
    <>
      <PageHero title={t("listing.title")} sub={t("listing.subtitle")} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5">{filters}</div></aside>
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">{t("listing.found", { count: filtered.length })}</p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild><Button variant="outline" className="h-11 lg:hidden"><SlidersHorizontal className="h-4 w-4" />{t("common.filters")}</Button></SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-5">
                  <SheetTitle className="mb-4 text-xl">{t("common.filters")}</SheetTitle>
                  {filters}
                </SheetContent>
              </Sheet>
              <select aria-label={t("common.sortBy")} value={search.sort ?? "upcoming"} onChange={(e) => set({ sort: e.target.value === "upcoming" ? undefined : e.target.value })} className="h-11 rounded-lg border border-input bg-card px-3">
                {["upcoming", "price_asc", "price_desc", "duration", "popular"].map((k) => <option key={k} value={k}>{t(`listing.sort.${k}`)}</option>)}
              </select>
            </div>
          </div>
          {shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="font-display text-2xl text-maroon">{t("listing.empty")}</h2>
              <p className="mt-2 text-muted-foreground">{t("listing.emptySub")}</p>
              <Button className="mt-5 rounded-full" onClick={() => void navigate({ search: {}, replace: true })}>{t("common.clear")}</Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((y) => <YatraCard key={y.id} y={y} nextDate={y.nextDate} />)}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page <= 1} onClick={() => void navigate({ search: (p) => ({ ...p, page: page - 1 }) })}>{t("common.prev")}</Button>
              <span>{t("common.page", { p: page, t: pages })}</span>
              <Button variant="outline" disabled={page >= pages} onClick={() => void navigate({ search: (p) => ({ ...p, page: page + 1 }) })}>{t("common.next")}</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="mb-2 font-semibold text-maroon">{title}</h3>{children}</div>;
}
