import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { audit, errMsg } from "@/lib/admin-client";

export const Route = createFileRoute("/admin/leads")({ component: Leads });
const STATUSES = ["new", "contacted", "converted", "closed"] as const;

function Leads() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data: staff = [] } = useQuery({
    queryKey: ["admin", "staff-list"],
    queryFn: async () => {
      const { data: r } = await supabase.from("user_roles").select("user_id").in("role", ["staff", "admin", "super_admin"]);
      const ids = [...new Set((r ?? []).map((x) => x.user_id))];
      return ids.length ? (await supabase.from("profiles").select("id, full_name, email").in("id", ids)).data ?? [] : [];
    },
  });
  const { data = [] } = useQuery({
    queryKey: ["admin", "leads", status],
    queryFn: async () => {
      let qq = supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(1000);
      if (status) qq = qq.eq("status", status as (typeof STATUSES)[number]);
      const { data, error } = await qq;
      if (error) throw error;
      return data;
    },
  });
  const rows = data.filter((l) => !q || `${l.name} ${l.mobile} ${l.email ?? ""} ${l.yatra_interest ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  async function update(id: string, patch: any) {
    const { error } = await supabase.from("enquiries").update(patch).eq("id", id);
    if (error) return void toast.error(errMsg(error));
    await audit("update", "enquiries", id, patch);
    qc.invalidateQueries({ queryKey: ["admin", "leads"] });
  }
  function exportCsv() {
    const cols = ["created_at", "name", "mobile", "email", "yatra_interest", "preferred_month", "source", "status", "follow_up_date", "notes", "message"] as const;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-2xl text-secondary">Leads</h1>
        <Input placeholder="Search name / mobile" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />CSV</Button>
      </div>
      <div className="divide-y rounded-lg border bg-card">
        {rows.map((l) => (
          <div key={l.id} className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
                <p className="font-medium">{l.name} <span className="text-sm font-normal text-muted-foreground">· {l.mobile} · {new Date(l.created_at).toLocaleDateString("en-IN")} · {l.source}</span></p>
                <p className="truncate text-sm text-muted-foreground">{l.yatra_interest} {l.preferred_month ? `· ${l.preferred_month}` : ""} {l.message ? `· ${l.message}` : ""}</p>
              </button>
              {l.follow_up_date && <Badge variant="outline">Follow up {l.follow_up_date}</Badge>}
              <select className="h-8 rounded-md border bg-background px-2 text-sm" value={l.status} onChange={(e) => update(l.id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              <a href={`tel:${l.mobile}`} className="text-primary" aria-label="Call"><Phone className="h-4 w-4" /></a>
              <a href={`https://wa.me/${l.mobile.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer" className="text-primary" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
            </div>
            {open === l.id && <LeadDetail lead={l} staff={staff} onSave={(p) => update(l.id, p)} />}
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-muted-foreground">No leads.</p>}
      </div>
    </div>
  );
}

function LeadDetail({ lead, staff, onSave }: { lead: any; staff: { id: string; full_name: string | null; email: string | null }[]; onSave: (p: Record<string, unknown>) => void }) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [fu, setFu] = useState(lead.follow_up_date ?? "");
  const [as, setAs] = useState(lead.assigned_to ?? "");
  return (
    <div className="mt-3 grid gap-3 rounded-md bg-muted/50 p-3 md:grid-cols-3">
      <div className="space-y-1 text-sm md:col-span-3">{lead.email && <p>Email: {lead.email}</p>}{lead.message && <p>Message: {lead.message}</p>}</div>
      <label className="text-sm">Assigned to<select className="mt-1 h-9 w-full rounded-md border bg-background px-2" value={as} onChange={(e) => setAs(e.target.value)}><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}</select></label>
      <label className="text-sm">Follow-up date<Input type="date" className="mt-1" value={fu} onChange={(e) => setFu(e.target.value)} /></label>
      <div />
      <Textarea className="md:col-span-3" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button className="w-fit" onClick={() => onSave({ notes, follow_up_date: fu || null, assigned_to: as || null })}>Save</Button>
    </div>
  );
}
