import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FieldGrid, type FieldDef, type Row } from "./fields";
import { audit, errMsg } from "@/lib/admin-client";

export type CrudConfig = {
  table: string;
  title: string;
  fields: FieldDef[];
  titleOf: (r: Row) => string;
  subtitleOf?: (r: Row) => string;
  imageOf?: (r: Row) => string | null | undefined;
  order?: { column: string; ascending: boolean };
  defaults?: Row;
  canCreate?: boolean;
  publishKey?: string;
};

export function CrudPage({ cfg }: { cfg: CrudConfig }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const order = cfg.order ?? { column: "sort_order", ascending: true };
  const key = ["admin", cfg.table];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase.from(cfg.table as any) as any).select("*").order(order.column, { ascending: order.ascending }).limit(1000);
      if (error) throw error;
      return data as Row[];
    },
  });
  const rows = useMemo(() => data.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())), [data, q]);
  const pub = cfg.publishKey ?? (data[0] && "is_published" in data[0] ? "is_published" : undefined);

  async function save() {
    if (!edit) return;
    for (const f of cfg.fields) {
      const val = f.type === "bi" || f.type === "bitext" ? edit[`${f.key}_en`] : edit[f.key];
      if (f.required && (val === undefined || val === null || val === "")) return void toast.error(`${f.label} is required`);
    }
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...payload } = edit;
      const t = supabase.from(cfg.table as any) as any;
      const res = id ? await t.update(payload).eq("id", id).select("id").single() : await t.insert(payload).select("id").single();
      if (res.error) throw res.error;
      await audit(id ? "update" : "create", cfg.table, res.data.id, { title: cfg.titleOf(edit) });
      toast.success("Saved");
      setEdit(null);
      qc.invalidateQueries({ queryKey: key });
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  }

  async function remove() {
    if (!del) return;
    const { error } = await (supabase.from(cfg.table as any) as any).delete().eq("id", del.id);
    if (error) return void toast.error(errMsg(error));
    await audit("delete", cfg.table, del.id, { title: cfg.titleOf(del) });
    toast.success("Deleted");
    setDel(null);
    qc.invalidateQueries({ queryKey: key });
  }

  async function togglePub(r: Row) {
    if (!pub) return;
    const { error } = await (supabase.from(cfg.table as any) as any).update({ [pub]: !r[pub] }).eq("id", r.id);
    if (error) return void toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-secondary">{cfg.title}</h1>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
          {cfg.canCreate !== false && <Button onClick={() => setEdit({ ...(cfg.defaults ?? {}) })}><Plus className="mr-1 h-4 w-4" />Add</Button>}
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Nothing here yet.</p> : (
        <div className="divide-y rounded-lg border bg-card">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              {cfg.imageOf?.(r) ? <img src={cfg.imageOf(r)!} alt="" className="h-12 w-16 shrink-0 rounded object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{cfg.titleOf(r) || "—"}</p>
                {cfg.subtitleOf && <p className="truncate text-sm text-muted-foreground">{cfg.subtitleOf(r)}</p>}
              </div>
              {pub && <button onClick={() => togglePub(r)}><Badge variant={r[pub] ? "default" : "outline"}>{r[pub] ? "Live" : "Hidden"}</Badge></button>}
              <Button variant="ghost" size="icon" onClick={() => setEdit({ ...r })} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDel(r)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "Add"} – {cfg.title}</DialogTitle></DialogHeader>
          {edit && <FieldGrid fields={cfg.fields} row={edit} set={(p) => setEdit((prev: Row) => ({ ...prev, ...p }))} />}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete “{del ? cfg.titleOf(del) : ""}”?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
