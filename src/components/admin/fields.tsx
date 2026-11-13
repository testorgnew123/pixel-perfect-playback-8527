import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, errMsg } from "@/lib/admin-client";

export type Row = any;
export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "bool" | "image" | "file" | "date" | "datetime" | "select" | "bi" | "bitext" | "list" | "bilist";
  options?: { value: string; label: string }[];
  placeholder?: string;
  wide?: boolean;
  required?: boolean;
};

export function ImageField({ value, onChange, folder, accept = "image/*" }: { value?: string | null; onChange: (v: string) => void; folder?: string; accept?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {value && accept.startsWith("image") ? <img src={value} alt="" className="h-14 w-20 rounded border object-cover" /> : null}
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="URL or upload" className="flex-1" />
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
        <label className="cursor-pointer">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <input type="file" accept={accept} className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try { onChange(await uploadImage(f, folder)); toast.success("Uploaded"); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); e.target.value = ""; }
          }} />
        </label>
      </Button>
    </div>
  );
}

const toLocalDT = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : "");

export function FieldInput({ f, row, set }: { f: FieldDef; row: Row; set: (patch: Row) => void }) {
  const v = row[f.key];
  switch (f.type) {
    case "bi":
    case "bitext": {
      const C = f.type === "bi" ? Input : Textarea;
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <C placeholder="English" value={row[`${f.key}_en`] ?? ""} onChange={(e: any) => set({ [`${f.key}_en`]: e.target.value })} rows={f.type === "bitext" ? 4 : undefined} />
          <C placeholder="हिंदी" value={row[`${f.key}_hi`] ?? ""} onChange={(e: any) => set({ [`${f.key}_hi`]: e.target.value })} rows={f.type === "bitext" ? 4 : undefined} />
        </div>
      );
    }
    case "bilist":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Textarea placeholder="English – one per line" rows={4} value={(row[`${f.key}_en`] ?? []).join("\n")} onChange={(e) => set({ [`${f.key}_en`]: e.target.value.split("\n").filter((s) => s.trim()) })} />
          <Textarea placeholder="हिंदी – एक पंक्ति में एक" rows={4} value={(row[`${f.key}_hi`] ?? []).join("\n")} onChange={(e) => set({ [`${f.key}_hi`]: e.target.value.split("\n").filter((s) => s.trim()) })} />
        </div>
      );
    case "list":
      return <Input placeholder={f.placeholder ?? "comma separated"} value={(v ?? []).join(", ")} onChange={(e) => set({ [f.key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />;
    case "textarea":
      return <Textarea rows={4} value={v ?? ""} onChange={(e) => set({ [f.key]: e.target.value })} />;
    case "number":
      return <Input type="number" value={v ?? ""} onChange={(e) => set({ [f.key]: e.target.value === "" ? null : Number(e.target.value) })} />;
    case "bool":
      return <Switch checked={!!v} onCheckedChange={(c) => set({ [f.key]: c })} />;
    case "image":
      return <ImageField value={v} onChange={(x) => set({ [f.key]: x })} />;
    case "file":
      return <ImageField value={v} onChange={(x) => set({ [f.key]: x })} accept="application/pdf,image/*" folder="files" />;
    case "date":
      return <Input type="date" value={v ? String(v).slice(0, 10) : ""} onChange={(e) => set({ [f.key]: e.target.value || null })} />;
    case "datetime":
      return <Input type="datetime-local" value={toLocalDT(v)} onChange={(e) => set({ [f.key]: e.target.value ? new Date(e.target.value).toISOString() : null })} />;
    case "select":
      return (
        <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={v ?? ""} onChange={(e) => set({ [f.key]: e.target.value })}>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    default:
      return <Input value={v ?? ""} placeholder={f.placeholder} onChange={(e) => set({ [f.key]: e.target.value })} />;
  }
}

export function FieldGrid({ fields, row, set }: { fields: FieldDef[]; row: Row; set: (patch: Row) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={f.type === "bool" ? "flex items-center justify-between gap-3 rounded-md border p-3" : f.wide || ["bi", "bitext", "bilist", "image", "file", "textarea"].includes(f.type) ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}>
          <Label>{f.label}{f.required ? " *" : ""}</Label>
          <FieldInput f={f} row={row} set={set} />
        </div>
      ))}
    </div>
  );
}

/** Editable ordered list of child rows (itinerary days, add-ons, FAQs…). */
export function RowsEditor({ rows, onChange, fields, blank, title }: { rows: Row[]; onChange: (r: Row[]) => void; fields: FieldDef[]; blank: () => Row; title: (r: Row, i: number) => string }) {
  const upd = (i: number, patch: Row) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const c = [...rows];
    [c[i], c[j]] = [c[j]!, c[i]!];
    onChange(c);
  };
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="font-medium">{title(r, i)}</p>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
          <FieldGrid fields={fields} row={r} set={(p) => upd(i, p)} />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...rows, blank()])}><Plus className="mr-1 h-4 w-4" />Add</Button>
    </div>
  );
}

export function SlabsEditor({ slabs, onChange }: { slabs: { min_days: number; refund_percent: number }[]; onChange: (v: { min_days: number; refund_percent: number }[]) => void }) {
  return (
    <div className="space-y-2">
      {slabs.map((x, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
          Cancelled <Input type="number" className="w-20" value={x.min_days} onChange={(e) => onChange(slabs.map((y, j) => (j === i ? { ...y, min_days: Number(e.target.value) } : y)))} /> or more days before departure →
          <Input type="number" className="w-20" value={x.refund_percent} onChange={(e) => onChange(slabs.map((y, j) => (j === i ? { ...y, refund_percent: Number(e.target.value) } : y)))} />% refund
          <Button variant="ghost" size="icon" onClick={() => onChange(slabs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...slabs, { min_days: 0, refund_percent: 0 }])}><Plus className="mr-1 h-4 w-4" />Add slab</Button>
    </div>
  );
}
