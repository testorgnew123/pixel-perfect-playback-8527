import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { me } = Route.useRouteContext();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const c = (t: string, f?: (q: any) => any) => { let q = (supabase.from(t as any) as any).select("id", { count: "exact", head: true }); if (f) q = f(q); return q.then((r: any) => r.count ?? 0); };
      const [yatras, drafts, deps, leads, bookings, recent, upcoming] = await Promise.all([
        c("yatras", (q) => q.eq("status", "published")),
        c("yatras", (q) => q.eq("status", "draft")),
        c("departures", (q) => q.gte("start_date", today)),
        c("enquiries", (q) => q.eq("status", "new")),
        c("bookings"),
        supabase.from("enquiries").select("id, name, mobile, yatra_interest, created_at, status").order("created_at", { ascending: false }).limit(6),
        supabase.from("departures").select("id, start_date, total_seats, booked_seats, status, yatras(title_en)").gte("start_date", today).order("start_date").limit(6),
      ]);
      return { yatras, drafts, deps, leads, bookings, recent: recent.data ?? [], upcoming: (upcoming.data ?? []) as any[] };
    },
  });
  const stats = [
    { label: "Published yatras", value: data?.yatras, to: "/admin/yatras" },
    { label: "Draft yatras", value: data?.drafts, to: "/admin/yatras" },
    { label: "Upcoming departures", value: data?.deps, to: "/admin/departures" },
    { label: "New leads", value: data?.leads, to: "/admin/leads" },
    { label: "Bookings", value: data?.bookings, to: "/admin" },
  ] as const;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-secondary">Namaste{me.name ? `, ${me.name}` : ""} 🙏</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}><Card className="transition hover:shadow-md"><CardContent className="p-4"><p className="text-3xl font-semibold text-primary">{s.value ?? "…"}</p><p className="text-sm text-muted-foreground">{s.label}</p></CardContent></Card></Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Latest leads</CardTitle></CardHeader><CardContent className="space-y-2">
          {data?.recent.map((l) => <div key={l.id} className="flex justify-between gap-2 text-sm"><span>{l.name} · {l.mobile}<br /><span className="text-muted-foreground">{l.yatra_interest}</span></span><Badge variant={l.status === "new" ? "default" : "outline"}>{l.status}</Badge></div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Next departures</CardTitle></CardHeader><CardContent className="space-y-2">
          {data?.upcoming.map((d) => <div key={d.id} className="flex justify-between gap-2 text-sm"><span>{d.yatras?.title_en}<br /><span className="text-muted-foreground">{d.start_date}</span></span><span>{d.booked_seats}/{d.total_seats}</span></div>)}
        </CardContent></Card>
      </div>
    </div>
  );
}
