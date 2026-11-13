import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createAdminUser, listAdminUsers, updateAdminUser } from "@/lib/admin.functions";
import { errMsg } from "@/lib/admin-client";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: ({ context }) => { if (!context.me.isSuper) throw redirect({ to: "/admin" }); },
  component: Users,
});
const ROLES = ["staff", "admin", "super_admin"] as const;
type R = (typeof ROLES)[number];

function Users() {
  const { me } = Route.useRouteContext();
  const qc = useQueryClient();
  const list = useServerFn(listAdminUsers);
  const create = useServerFn(createAdminUser);
  const update = useServerFn(updateAdminUser);
  const { data = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: () => list() });
  const [form, setForm] = useState<{ email: string; full_name: string; password: string; role: R } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });
  async function run(p: Promise<unknown>, msg: string) { try { await p; toast.success(msg); refresh(); } catch (e) { toast.error(errMsg(e)); } }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="font-display text-2xl text-secondary">Admin users</h1><Button onClick={() => setForm({ email: "", full_name: "", password: "", role: "staff" })}><Plus className="mr-1 h-4 w-4" />Add user</Button></div>
      <p className="text-sm text-muted-foreground">Staff: manage yatras, departures, content and leads. Admin: also settings, refunds and audit log. Super admin: also manages admin users.</p>
      <div className="divide-y rounded-lg border bg-card">
        {data.map((u) => {
          const role = (ROLES.slice().reverse().find((r) => u.roles.includes(r)) ?? "staff") as R;
          const self = u.id === me.id;
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1"><p className="font-medium">{u.full_name || u.email} {self && <span className="text-sm text-muted-foreground">(you)</span>}</p><p className="text-sm text-muted-foreground">{u.email}</p></div>
              {u.must_change_password && <Badge variant="outline">Temp password</Badge>}
              {!u.is_active && <Badge variant="destructive">Disabled</Badge>}
              <select disabled={self} className="h-8 rounded-md border bg-background px-2 text-sm" value={role} onChange={(e) => run(update({ data: { userId: u.id, role: e.target.value as R } }), "Role updated")}>{ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}</select>
              {!self && <Button variant="outline" size="sm" onClick={() => run(update({ data: { userId: u.id, is_active: !u.is_active } }), u.is_active ? "Disabled" : "Enabled")}>{u.is_active ? "Disable" : "Enable"}</Button>}
              {!self && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm("Remove admin access for this user?") && run(update({ data: { userId: u.id, remove: true } }), "Access removed")}>Remove</Button>}
            </div>
          );
        })}
      </div>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add admin user</DialogTitle></DialogHeader>
          {form && <div className="space-y-3">
            <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Temporary password (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as R })}>{ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}</select>
            <p className="text-xs text-muted-foreground">They will be asked to change this password on first login.</p>
          </div>}
          <DialogFooter><Button onClick={() => form && run(create({ data: form }).then(() => setForm(null)), "User created")}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
