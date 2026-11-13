import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGrid, type Row } from "@/components/admin/fields";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { audit, errMsg } from "@/lib/admin-client";

const STATUSES = ["available", "filling_fast", "sold_out", "closed", "completed"];

export function DeparturesManager({ yatraId }: { yatraId?: string }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Row | null>(null);
  const [filter, setFilter] = useState(yatraId ?? "");
  const [past, setPast] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const { data: yatras = [] } = useQuery({ queryKey: ["admin", "yatra-names"], queryFn: async () => (await supabase.from("yatras").select("id, title_en, duration_days").order("title_en")).data ?? [] });
  const key = ["admin", "departures", filter, past];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = supabase.from("departures").select("*, yatras(title_en)").order("start_date", { ascending: !past }).limit(500);
      q = past ? q.lt("start_date", today) : q.gte("start_date", today);
      if (filter) q = q.eq("yatra_id", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
  const fields = [
    { key: "yatra_id", label: "Yatra", type: "select" as const, options: [{ value: "", label: "Select…" }, ...yatras.map((y) => ({ value: y.id, label: y.title_en }))], wide: true, required: true },
    { key: "start_date", label: "Start date", type: "date" as const, required: true },
    { key: "end_date", label: "End date (auto from duration if blank)", type: "date" as const },
    { key: "total_seats", label: "Total seats", type: "number" as const, required: true },
    { key: "price_override", label: "Special price ₹ (blank = yatra price)", type: "number" as const },
    { key: "status", label: "Status", type: "select" as const, options: STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") })) },
  ];
  async function save() {
    if (!edit?.yatra_id || !edit.start_date || !edit.total_seats) return void toast.error("Yatra, start date and seats are required");
    let end = edit.end_date;
    if (!end) {
      const days = yatras.find((y) => y.id === edit.yatra_id)?.duration_days ?? 1;
      const d = new Date(edit.start_date + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + days - 1); end = d.toISOString().slice(0, 10);
    }
    if (end < edit.start_date) return void toast.error("End date is before start date");
    if (edit.total_seats < (edit.booked_seats ?? 0)) return void toast.error(`Already ${edit.booked_seats} seats booked`);
    const payload = { yatra_id: edit.yatra_id, start_date: edit.start_date, end_date: end, total_seats: edit.total_seats, price_override: edit.price_override ?? null, status: edit.status ?? "available" };
    const res = edit.id ? await supabase.from("departures").update(payload).eq("id", edit.id).select("id").single() : await supabase.from("departures").insert(payload).select("id").single();
    if (res.error) return void toast.error(errMsg(res.error));
    await audit(edit.id ? "update" : "create", "departures", res.data.id, payload);
    toast.success("Saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin", "departures"] });
  }
  async function remove(d: Row) {
    if (d.booked_seats > 0) return void toast.error("This departure has bookings — close it instead");
    if (!confirm("Delete this departure?")) return;
    const { error } = await supabase.from("departures").delete().eq("id", d.id);
    if (error) return void toast.error(errMsg(error));
    await audit("delete", "departures", d.id); qc.invalidateQueries({ queryKey: ["admin", "departures"] });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {!yatraId && <select className="h-9 rounded-md border bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All yatras</option>{yatras.map((y) => <option key={y.id} value={y.id}>{y.title_en}</option>)}</select>}
        <Button variant={past ? "outline" : "secondary"} size="sm" onClick={() => setPast(false)}>Upcoming</Button>
        <Button variant={past ? "secondary" : "outline"} size="sm" onClick={() => setPast(true)}>Past</Button>
        <div className="flex-1" />
        <Button onClick={() => setEdit({ yatra_id: yatraId ?? filter, total_seats: 40, status: "available" })}><Plus className="mr-1 h-4 w-4" />Add departure</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>{!yatraId && <th className="p-2">Yatra</th>}<th className="p-2">Dates</th><th className="p-2">Seats</th><th className="p-2">Price</th><th className="p-2">Status</th><th /></tr></thead>
          <tbody>{data.map((d) => {
            const left = d.total_seats - d.booked_seats;
            return (
              <tr key={d.id} className="border-t">
                {!yatraId && <td className="p-2">{d.yatras?.title_en}</td>}
                <td className="whitespace-nowrap p-2">{d.start_date} → {d.end_date}</td>
                <td className="p-2">{d.booked_seats}/{d.total_seats} <span className={left <= 5 ? "text-destructive" : "text-muted-foreground"}>({left} left)</span></td>
                <td className="p-2">{d.price_override ? `₹${d.price_override}` : "—"}</td>
                <td className="p-2"><Badge variant="outline">{d.status.replace("_", " ")}</Badge></td>
                <td className="whitespace-nowrap p-2 text-right"><Button variant="ghost" size="icon" onClick={() => setEdit({ ...d })}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            );
          })}</tbody>
        </table>
        {data.length === 0 && <p className="p-6 text-center text-muted-foreground">No departures.</p>}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit departure" : "New departure"}</DialogTitle></DialogHeader>
          {edit && <FieldGrid fields={yatraId ? fields.slice(1) : fields} row={edit} set={(p) => setEdit((e) => ({ ...e!, ...p }))} />}
          {edit?.id && <p className="text-sm text-muted-foreground">Booked seats: {edit.booked_seats}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

