import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/admin-misc.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { me } = Route.useRouteContext();
  const statsFn = useServerFn(getDashboardStats);
  const { data } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => statsFn() });
  const stats = [
    { label: "Published yatras", value: data?.yatras, to: "/admin/yatras" },
    { label: "Draft yatras", value: data?.drafts, to: "/admin/yatras" },
    { label: "Upcoming departures", value: data?.deps, to: "/admin/departures" },
    { label: "New leads", value: data?.leads, to: "/admin/leads" },
    { label: "Bookings", value: data?.bookings, to: "/admin/bookings" },
  ] as const;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-maroon">Namaste{me.name ? `, ${me.name}` : ""} 🙏</h1>
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
          {data?.upcoming.map((d) => <div key={d.id} className="flex justify-between gap-2 text-sm"><span>{d.yatra?.title_en}<br /><span className="text-muted-foreground">{d.start_date}</span></span><span>{d.booked_seats}/{d.total_seats}</span></div>)}
        </CardContent></Card>
      </div>
    </div>
  );
}
