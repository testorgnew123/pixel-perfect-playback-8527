import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGrid, type Row } from "@/components/admin/fields";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getManifest } from "@/lib/booking.functions";
import { listYatraNames, listDeparturesAdmin, saveDeparture, deleteDeparture } from "@/lib/admin-misc.functions";
import { toast } from "sonner";
import { errMsg } from "@/lib/admin-client";

const STATUSES = ["available", "filling_fast", "sold_out", "closed", "completed"];

export function DeparturesManager({ yatraId }: { yatraId?: string }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Row | null>(null);
  const [filter, setFilter] = useState(yatraId ?? "");
  const [past, setPast] = useState(false);
  const manifestFn = useServerFn(getManifest);
  const namesFn = useServerFn(listYatraNames);
  const departuresFn = useServerFn(listDeparturesAdmin);
  const saveFn = useServerFn(saveDeparture);
  const deleteFn = useServerFn(deleteDeparture);
  const [manifest, setManifest] = useState<{ title: string; rows: any[]; isAdmin: boolean } | null>(null);
  async function openManifest(d: Row) { try { const r = await manifestFn({ data: { departureId: d.id } }); setManifest({ title: `${d.yatra?.title_en ?? ""} ${d.start_date}`, ...r }); } catch (e) { toast.error(errMsg(e)); } }
  function manifestCsv() {
    if (!manifest) return;
    const cols = ["code", "status", "name", "type", "age", "gender", "mobile", "contact", "pickup", "meal", "id_type", "id", "medical"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + [cols.join(","), ...manifest.rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n")], { type: "text/csv" }));
    a.download = `manifest-${manifest.title.replace(/\s+/g, "-")}.csv`; a.click();
  }
  const { data: yatras = [] } = useQuery({ queryKey: ["admin", "yatra-names"], queryFn: () => namesFn() });
  const key = ["admin", "departures", filter, past];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: () => departuresFn({ data: { yatraId: filter || undefined, past } }),
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
    const payload = { id: edit.id, yatra_id: edit.yatra_id, start_date: edit.start_date, end_date: end, total_seats: edit.total_seats, price_override: edit.price_override ?? null, status: edit.status ?? "available" };
    try {
      await saveFn({ data: payload });
      toast.success("Saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin", "departures"] });
    } catch (e) { toast.error(errMsg(e)); }
  }
  async function remove(d: Row) {
    if (d.booked_seats > 0) return void toast.error("This departure has bookings — close it instead");
    if (!confirm("Delete this departure?")) return;
    try {
      await deleteFn({ data: { id: d.id } });
      qc.invalidateQueries({ queryKey: ["admin", "departures"] });
    } catch (e) { toast.error(errMsg(e)); }
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
                {!yatraId && <td className="p-2">{d.yatra?.title_en}</td>}
                <td className="whitespace-nowrap p-2">{d.start_date} → {d.end_date}</td>
                <td className="p-2">{d.booked_seats}/{d.total_seats} <span className={left <= 5 ? "text-destructive" : "text-muted-foreground"}>({left} left)</span></td>
                <td className="p-2">{d.price_override ? `₹${d.price_override}` : "—"}</td>
                <td className="p-2"><Badge variant="outline">{d.status.replace("_", " ")}</Badge></td>
                <td className="whitespace-nowrap p-2 text-right"><Button variant="ghost" size="icon" onClick={() => openManifest(d)} aria-label="Manifest"><Users className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setEdit({ ...d })}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            );
          })}</tbody>
        </table>
        {data.length === 0 && <p className="p-6 text-center text-muted-foreground">No departures.</p>}
      </div>
      <Dialog open={!!manifest} onOpenChange={(o) => !o && setManifest(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-auto">
          <DialogHeader><DialogTitle>Manifest – {manifest?.title} ({manifest?.rows.length} travellers)</DialogTitle></DialogHeader>
          {!manifest?.isAdmin && <p className="text-sm text-muted-foreground">ID numbers are masked and medical info hidden for staff accounts.</p>}
          <table className="w-full text-xs"><thead className="bg-muted text-left"><tr>{["Code", "Name", "Age", "Gender", "Mobile", "Pickup", "Meal", "ID", "Medical"].map((h) => <th key={h} className="p-1.5">{h}</th>)}</tr></thead>
            <tbody>{manifest?.rows.map((r, i) => <tr key={i} className="border-t"><td className="p-1.5">{r.code}</td><td className="p-1.5">{r.name} ({r.type})</td><td className="p-1.5">{r.age}</td><td className="p-1.5">{r.gender}</td><td className="p-1.5">{r.mobile || r.contact}</td><td className="p-1.5">{r.pickup}</td><td className="p-1.5">{r.meal}</td><td className="p-1.5">{r.id_type} {r.id}</td><td className="p-1.5">{r.medical}</td></tr>)}</tbody></table>
          <DialogFooter><Button variant="outline" onClick={manifestCsv}>Download CSV</Button><Button onClick={() => window.print()}>Print</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit departure" : "New departure"}</DialogTitle></DialogHeader>
          {edit && <FieldGrid fields={yatraId ? fields.slice(1) : fields} row={edit} set={(p) => setEdit((prev: Row) => ({ ...prev, ...p }))} />}
          {edit?.id && <p className="text-sm text-muted-foreground">Booked seats: {edit.booked_seats}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

