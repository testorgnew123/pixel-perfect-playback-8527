import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Map, CalendarDays, PhoneCall, FileText, Settings, Users, History, LogOut, ExternalLink, Ticket, Star, BookOpen } from "lucide-react";

export type AdminMe = { id: string; email: string; name: string; roles: string[]; isAdmin: boolean; isSuper: boolean };

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    const [{ data: roles }, { data: prof }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("full_name, must_change_password, is_active").eq("id", user.id).maybeSingle(),
    ]);
    const r = (roles ?? []).map((x) => x.role as string);
    if (!r.some((x) => ["staff", "admin", "super_admin"].includes(x)) || prof?.is_active === false) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login", search: { redirect: undefined, denied: "1" } });
    }
    if (prof?.must_change_password) throw redirect({ to: "/admin/change-password" });
    const me: AdminMe = { id: user.id, email: user.email ?? "", name: prof?.full_name ?? "", roles: r, isAdmin: r.includes("admin") || r.includes("super_admin"), isSuper: r.includes("super_admin") };
    return { me };
  },
  head: () => ({ meta: [{ title: "Admin | Hari Shiv Shankar Tirth Yatra" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/yatras", label: "Yatras", icon: Map },
  { to: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { to: "/admin/departures", label: "Departures", icon: CalendarDays },
  { to: "/admin/leads", label: "Leads", icon: PhoneCall },
  { to: "/admin/content/$kind", kind: "blog", label: "Content", icon: FileText },
  { to: "/admin/content/$kind", kind: "coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/content/$kind", kind: "reviews", label: "Reviews", icon: Star },
] as const;

function AdminLayout() {
  const { me } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", search: { redirect: undefined }, replace: true });
  }
  const link = "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-maroon-foreground/80 hover:bg-maroon-foreground/10";
  const active = { className: "bg-maroon-foreground/15 text-maroon-foreground font-medium" };
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-60 shrink-0 flex-col bg-maroon p-3 text-maroon-foreground md:flex">
        <p className="px-3 py-3 font-display text-lg leading-tight">हरि शिव शंकर<br /><span className="text-sm opacity-80">Admin</span></p>
        <nav className="mt-2 flex-1 space-y-1">
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} params={("kind" in n ? { kind: n.kind } : {}) as never} className={link} activeProps={active} activeOptions={{ exact: "exact" in n }}><n.icon className="h-4 w-4" />{n.label}</Link>
          ))}
          {me.isAdmin && <Link to="/admin/settings" className={link} activeProps={active}><Settings className="h-4 w-4" />Settings</Link>}
          {me.isSuper && <Link to="/admin/users" className={link} activeProps={active}><Users className="h-4 w-4" />Admin users</Link>}
          {me.isAdmin && <Link to="/admin/audit" className={link} activeProps={active}><History className="h-4 w-4" />Audit log</Link>}
        </nav>
        <a href="/hi" target="_blank" rel="noreferrer" className={link}><ExternalLink className="h-4 w-4" />View site</a>
        <div className="mt-2 border-t border-maroon-foreground/20 px-3 pt-3 text-xs opacity-80">{me.email}<br />{me.roles.filter((r) => r !== "customer").join(", ")}</div>
        <Button variant="ghost" className="mt-2 justify-start text-maroon-foreground hover:bg-maroon-foreground/10 hover:text-maroon-foreground" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 overflow-x-auto border-b bg-maroon p-2 text-maroon-foreground md:hidden">
          {NAV.map((n) => <Link key={n.label} to={n.to} params={("kind" in n ? { kind: n.kind } : {}) as never} className="whitespace-nowrap rounded px-2 py-1 text-sm" activeProps={{ className: "bg-maroon-foreground/15" }} activeOptions={{ exact: "exact" in n }}>{n.label}</Link>)}
          {me.isAdmin && <Link to="/admin/settings" className="whitespace-nowrap px-2 py-1 text-sm">Settings</Link>}
          {me.isSuper && <Link to="/admin/users" className="whitespace-nowrap px-2 py-1 text-sm">Users</Link>}
          <button onClick={signOut} className="whitespace-nowrap px-2 py-1 text-sm">Sign out</button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
