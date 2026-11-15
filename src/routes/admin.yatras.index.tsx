import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listYatrasAdmin } from "@/lib/admin-misc.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Ban, CheckCircle2, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { loadYatra, saveYatra } from "@/components/admin/yatra-data";
import { deleteYatraAdmin, setYatraEnabledAdmin } from "@/lib/admin-yatra.functions";
import { errMsg } from "@/lib/admin-client";

export const Route = createFileRoute("/admin/yatras/")({ component: YatraList });

function YatraList() {
  const { me } = Route.useRouteContext();
  const qc = useQueryClient();
  async function setEnabled(id: string, enabled: boolean) {
    try {
      await setYatraEnabledAdmin({ data: { id, enabled } });
      toast.success(enabled ? "Yatra enabled (published)" : "Yatra disabled (archived)");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["public"] });
    } catch (e) { toast.error(errMsg(e)); }
  }
  const [del, setDel] = useState<{ id: string; title: string } | null>(null);
  async function remove() {
    if (!del) return;
    try {
      await deleteYatraAdmin({ data: { id: del.id } });
      toast.success("Yatra deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["public"] });
    } catch (e) { toast.error(errMsg(e)); } finally { setDel(null); }
  }
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const listFn = useServerFn(listYatrasAdmin);
  const { data = [] } = useQuery({ queryKey: ["admin", "yatras"], queryFn: () => listFn() });
  const rows = data.filter((y) => (!status || y.status === status) && (!q || `${y.title_en} ${y.title_hi} ${y.slug}`.toLowerCase().includes(q.toLowerCase())));
  async function duplicate(id: string) {
    try {
      const st = await loadYatra(id);
      st.y = { ...st.y, id: undefined, slug: `${st.y.slug}-copy-${Date.now().toString(36).slice(-4)}`, title_en: `${st.y.title_en} (copy)`, status: "draft" };
      const newId = await saveYatra(st, "duplicate");
      qc.invalidateQueries({ queryKey: ["admin", "yatras"] });
      navigate({ to: "/admin/yatras/$id", params: { id: newId } });
    } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-2xl text-maroon">Yatras</h1>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <Button asChild><Link to="/admin/yatras/$id" params={{ id: "new" }}><Plus className="mr-1 h-4 w-4" />New yatra</Link></Button>
      </div>
      <div className="divide-y rounded-lg border bg-card">
        {rows.map((y) => (
          <div key={y.id} className="flex items-center gap-3 p-3">
            {y.cover_image ? <img src={y.cover_image} alt="" className="h-12 w-16 rounded object-cover" /> : <div className="h-12 w-16 rounded bg-muted" />}
            <Link to="/admin/yatras/$id" params={{ id: y.id }} className="min-w-0 flex-1">
              <p className="truncate font-medium">{y.title_en}</p>
              <p className="truncate text-sm text-muted-foreground">{y.title_hi} · {y.duration_days} days · ₹{y.price ?? "—"}</p>
            </Link>
            {y.featured && <Badge variant="secondary">Featured</Badge>}
            <Badge variant={y.status === "published" ? "default" : "outline"}>{y.status}</Badge>
            <Button variant="ghost" size="icon" onClick={() => duplicate(y.id)} aria-label="Duplicate"><Copy className="h-4 w-4" /></Button>
            {y.status === "published"
              ? <Button variant="ghost" size="icon" onClick={() => setEnabled(y.id, false)} aria-label="Disable" title="Disable (hide from site)"><Ban className="h-4 w-4" /></Button>
              : <Button variant="ghost" size="icon" onClick={() => setEnabled(y.id, true)} aria-label="Enable" title="Enable (publish)"><CheckCircle2 className="h-4 w-4" /></Button>}
            {me.isAdmin && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDel({ id: y.id, title: y.title_en })} aria-label="Delete" title="Delete"><Trash2 className="h-4 w-4" /></Button>}
          </div>
        ))}
      </div>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{del?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes the yatra and its departures and cannot be undone. Yatras with bookings cannot be deleted — disable them instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
