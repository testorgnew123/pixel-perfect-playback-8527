import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { inviteAgent, listAgents, listCommissions, listPendingAgentPayments, saveAgentDefaults, setCommissionStatus, updateAgent, verifyAgentPayment } from "@/lib/admin-agents.functions";
import { COMMISSION_STATUSES } from "@/lib/commission";
import { errMsg } from "@/lib/admin-client";

const inr = (n: number | string) => `₹${Number(n).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);
const cBadge = (s: string) => (s === "clawback" ? "destructive" : s === "payable" ? "default" : s === "paid" ? "secondary" : "outline") as "destructive" | "default" | "secondary" | "outline";

export function AgentsAdmin() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-maroon">Agents</h1>
      <Tabs defaultValue="agents">
        <TabsList><TabsTrigger value="agents">Agents</TabsTrigger><TabsTrigger value="commissions">Commissions</TabsTrigger><TabsTrigger value="payments">Payments to verify</TabsTrigger></TabsList>
        <TabsContent value="agents"><AgentsTab /></TabsContent>
        <TabsContent value="commissions"><CommissionsTab /></TabsContent>
        <TabsContent value="payments"><PaymentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function useRun() {
  const qc = useQueryClient();
  return async (p: Promise<unknown>, msg: string) => { try { await p; toast.success(msg); qc.invalidateQueries({ queryKey: ["admin"] }); return true; } catch (e) { toast.error(errMsg(e)); return false; } };
}

type AgentForm = { id?: string; email: string; full_name: string; phone: string; commission_percent: string };

function AgentsTab() {
  const run = useRun();
  const qc = useQueryClient();
  const list = useServerFn(listAgents);
  const invite = useServerFn(inviteAgent);
  const update = useServerFn(updateAgent);
  const saveDefaults = useServerFn(saveAgentDefaults);
  const { data } = useQuery({ queryKey: ["admin", "agents"], queryFn: () => list() });
  const [form, setForm] = useState<AgentForm | null>(null);
  const [sent, setSent] = useState<{ loginUrl: string; emailOk: boolean } | null>(null);
  const [def, setDef] = useState<string | null>(null);
  if (!data) return <p>Loading…</p>;

  async function submit() {
    if (!form) return;
    if (form.id) {
      if (await run(update({ data: { id: form.id, full_name: form.full_name, phone: form.phone, commission_percent: form.commission_percent } }), "Agent updated")) setForm(null);
      return;
    }
    try {
      const r = await invite({ data: { email: form.email, full_name: form.full_name, phone: form.phone, commission_percent: form.commission_percent } });
      setSent({ loginUrl: r.loginUrl, emailOk: r.emailOk });
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) { toast.error(errMsg(e)); }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">Agents book on behalf of customers and earn commission on the pre-GST amount once a booking is fully paid. Only emails on the website domain can be invited, and an agent can only sign in with the emailed code.</p>
        <Button onClick={() => setForm({ email: "", full_name: "", phone: "", commission_percent: "" })}><Plus className="mr-1 h-4 w-4" />Invite agent</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 text-sm">
        <span>Default commission for agents without their own rate:</span>
        <Input className="w-24" type="number" min={0} max={100} step="0.01" value={def ?? String(data.defaultPercent)} onChange={(e) => setDef(e.target.value)} />%
        <Button size="sm" variant="outline" disabled={def === null} onClick={async () => { if (await run(saveDefaults({ data: { percent: def ?? "" } }), "Default saved")) setDef(null); }}>Save</Button>
      </div>
      <div className="divide-y rounded-lg border bg-card">
        {data.agents.length === 0 && <p className="p-4 text-sm text-muted-foreground">No agents yet.</p>}
        {data.agents.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.full_name} <Badge variant={a.status === "suspended" ? "destructive" : a.status === "active" ? "default" : "outline"} className="ml-1 align-middle">{a.status}</Badge></p>
              <p className="text-sm text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
              <p className="text-xs text-muted-foreground">{a.user_id ? "Has signed in" : "Has not signed in yet"} · Rate {a.commission_percent != null ? `${Number(a.commission_percent)}%` : `${data.defaultPercent}% (default)`} · {a.bookings} booking(s)</p>
            </div>
            <div className="text-right text-sm"><p>Pending {inr(a.pending)}</p><p>Payable {inr(a.payable)}</p><p>Paid {inr(a.paid)}</p>{a.clawback > 0 && <p className="text-destructive">Clawback {inr(a.clawback)}</p>}</div>
            <Button variant="outline" size="sm" onClick={() => setForm({ id: a.id, email: a.email, full_name: a.full_name, phone: a.phone ?? "", commission_percent: a.commission_percent ?? "" })}>Edit</Button>
            {a.status === "suspended"
              ? <Button variant="outline" size="sm" onClick={() => run(update({ data: { id: a.id, status: "active" } }), "Agent reactivated")}>Reactivate</Button>
              : <Button variant="outline" size="sm" onClick={() => confirm(`Suspend ${a.full_name}? They lose agent access immediately.`) && run(update({ data: { id: a.id, status: "suspended" } }), "Agent suspended")}>Suspend</Button>}
            {!a.user_id && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm("Delete this unused invite?") && run(update({ data: { id: a.id, revoke: true } }), "Invite deleted")}>Delete invite</Button>}
          </div>
        ))}
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Edit agent" : "Invite agent"}</DialogTitle></DialogHeader>
          {form && <div className="space-y-3">
            <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input placeholder="name@harishivshankartirthyatra.com" type="email" disabled={!!form.id} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder={`Commission % (blank = default ${data.defaultPercent}%)`} type="number" min={0} max={100} step="0.01" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} />
            {!form.id && <p className="text-xs text-muted-foreground">Only an email on the website domain is accepted. The agent signs in at the agent login page with a one-time code sent to this address.</p>}
          </div>}
          <DialogFooter><Button onClick={submit}>{form?.id ? "Save" : "Send invite"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sent} onOpenChange={(o) => !o && setSent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite saved</DialogTitle></DialogHeader>
          {sent && <div className="space-y-2 text-sm">
            <p>{sent.emailOk ? "An invite email was sent (if the server's mail is configured; otherwise it was only logged)." : "The invite email could not be sent. Share this link yourself:"}</p>
            <Input readOnly value={sent.loginUrl} onFocus={(e) => e.target.select()} />
          </div>}
          <DialogFooter><Button onClick={() => setSent(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommissionsTab() {
  const run = useRun();
  const agentsFn = useServerFn(listAgents);
  const listFn = useServerFn(listCommissions);
  const setFn = useServerFn(setCommissionStatus);
  const [status, setStatus] = useState("");
  const [agentId, setAgentId] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const { data: agentData } = useQuery({ queryKey: ["admin", "agents"], queryFn: () => agentsFn() });
  const { data = [] } = useQuery({ queryKey: ["admin", "commissions", status, agentId], queryFn: () => listFn({ data: { status, agentId } }) });
  const chosen = data.filter((r) => sel.includes(r.id));
  const total = chosen.reduce((n, r) => n + Number(r.amount), 0);
  const canPay = chosen.length > 0 && chosen.every((r) => r.status === "payable");
  const canResolve = chosen.length > 0 && chosen.every((r) => r.status === "clawback");

  async function pay() {
    const early = chosen.filter((r) => r.start_date && r.start_date > today());
    if (early.length && !confirm(`${early.length} of these bookings have not departed yet and can still be cancelled (the commission would then become a clawback). Pay out anyway?`)) return;
    const ref = window.prompt(`Payout reference for ${inr(total)} (UTR / cheque no.)`);
    if (ref && (await run(setFn({ data: { ids: sel, to: "paid", reference: ref } }), "Marked paid"))) setSel([]);
  }
  async function resolve() {
    const note = window.prompt("Note (e.g. recovered via UTR…, or waived)");
    if (note && (await run(setFn({ data: { ids: sel, to: "void", reference: note } }), "Clawback resolved"))) setSel([]);
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setSel([]); }}><option value="">All statuses</option>{COMMISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={agentId} onChange={(e) => { setAgentId(e.target.value); setSel([]); }}><option value="">All agents</option>{agentData?.agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select>
        <span className="ml-auto text-sm text-muted-foreground">{chosen.length ? `${chosen.length} selected · ${inr(total)}` : "Select payable rows to pay out"}</span>
        <Button size="sm" disabled={!canPay} onClick={pay}>Mark paid</Button>
        <Button size="sm" variant="outline" disabled={!canResolve} onClick={resolve}>Resolve clawback</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-2" /><th className="p-2">Booking</th><th className="p-2">Agent</th><th className="p-2">Departure</th><th className="p-2">Booking paid</th><th className="p-2">Rate</th><th className="p-2">Commission</th><th className="p-2">Status</th></tr></thead>
          <tbody>
            {data.length === 0 && <tr><td colSpan={8} className="p-4 text-muted-foreground">No commissions.</td></tr>}
            {data.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2"><input type="checkbox" disabled={r.status !== "payable" && r.status !== "clawback"} checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} /></td>
                <td className="p-2"><Link to="/admin/bookings/$id" params={{ id: r.booking_id }} className="text-maroon underline">{r.booking_code}</Link><p className="text-xs text-muted-foreground">{r.booking_status.replace(/_/g, " ")}</p></td>
                <td className="p-2">{r.agent_name}<p className="text-xs text-muted-foreground">{r.agent_email}</p></td>
                <td className="p-2">{r.start_date ?? "—"}<p className="text-xs text-muted-foreground">{r.yatra}</p></td>
                <td className="p-2">{inr(r.paid)} / {inr(r.total)}</td>
                <td className="p-2">{Number(r.rate_percent)}% of {inr(r.basis_amount)}</td>
                <td className="p-2 font-medium">{inr(r.amount)}</td>
                <td className="p-2"><Badge variant={cBadge(r.status)}>{r.status}</Badge>{r.payout_reference && <p className="mt-1 text-xs text-muted-foreground">{r.payout_reference}</p>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const run = useRun();
  const listFn = useServerFn(listPendingAgentPayments);
  const verifyFn = useServerFn(verifyAgentPayment);
  const { data = [] } = useQuery({ queryKey: ["admin", "agent-payments"], queryFn: () => listFn() });
  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-muted-foreground">Payments agents say they collected. Nothing counts (no booking status change, no commission) until you verify it against the money actually received.</p>
      <div className="divide-y rounded-lg border bg-card">
        {data.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing waiting for verification.</p>}
        {data.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{inr(p.amount)} · {p.method} · <Link to="/admin/bookings/$id" params={{ id: p.booking_id }} className="text-maroon underline">{p.booking_code}</Link></p>
              <p className="text-sm text-muted-foreground">Ref: {p.reference} · by {p.agent_name ?? "unknown agent"} · {new Date(p.created_at).toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">Booking paid {inr(p.paid)} of {inr(p.total)} ({p.booking_status.replace(/_/g, " ")})</p>
            </div>
            <Button size="sm" onClick={() => run(verifyFn({ data: { paymentId: p.id, approve: true } }), "Payment verified")}>Verify</Button>
            <Button size="sm" variant="outline" onClick={() => { const note = window.prompt("Reason for rejecting (optional)") ?? ""; run(verifyFn({ data: { paymentId: p.id, approve: false, note } }), "Payment rejected"); }}>Reject</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
