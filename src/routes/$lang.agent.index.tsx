import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLang } from "@/lib/use-lang";
import { useSessionUser } from "@/lib/use-session";
import { formatDate, formatINR, loc } from "@/lib/format";
import { AGENT_PAYMENT_METHODS } from "@/lib/commission";
import { agentRecordPayment, getAgentMe, listMyAgentBookings } from "@/lib/agent.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/agent/")({
  head: ({ params }) => {
    const m = pageMeta(params.lang, { hi: "एजेंट पोर्टल", en: "Agent portal" }, { hi: "एजेंट बुकिंग और कमीशन", en: "Agent bookings and commission" });
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: AgentPortal,
});

type PayForm = { bookingId: string; code: string; amount: string; method: string; reference: string };

function AgentPortal() {
  const { t } = useTranslation();
  const lang = useLang();
  const qc = useQueryClient();
  const { user, ready } = useSessionUser();
  const meFn = useServerFn(getAgentMe);
  const listFn = useServerFn(listMyAgentBookings);
  const payFn = useServerFn(agentRecordPayment);
  const isAgent = !!user?.isAgent; // UI hint only: every agent server fn re-checks on the server
  const me = useQuery({ queryKey: ["agent", "me", user?.id], enabled: isAgent, queryFn: () => meFn() });
  const list = useQuery({ queryKey: ["agent", "bookings", user?.id], enabled: isAgent, queryFn: () => listFn() });
  const [pay, setPay] = useState<PayForm | null>(null);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await authClient.signOut();
    window.location.assign(`/${lang}`);
  }
  async function submitPayment() {
    if (!pay) return;
    setBusy(true);
    try {
      await payFn({ data: { bookingId: pay.bookingId, amount: Number(pay.amount), method: pay.method, reference: pay.reference } });
      toast.success(t("agent.recorded"));
      setPay(null);
      qc.invalidateQueries({ queryKey: ["agent"] });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  if (!ready) return <p className="p-10 text-center text-muted-foreground">{t("common.loading")}</p>;
  if (!isAgent) return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <h1 className="font-display text-2xl text-maroon">{t("agent.notAgentTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("agent.notAgentText")}</p>
      <Button asChild size="lg" className="mt-4 h-12 rounded-full"><Link to="/$lang/agent/login" params={{ lang }}>{t("agent.signIn")}</Link></Button>
    </div>
  );

  const rows = list.data?.bookings ?? [];
  const totals = list.data?.totals;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-maroon">{t("agent.portalTitle")}</h1>
          {me.data && <><p className="text-muted-foreground">{t("agent.welcome", { name: me.data.name })} · {me.data.email}</p><p className="text-sm">{t("agent.rate", { rate: me.data.rate })}</p></>}
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-full"><Link to="/$lang/departures" params={{ lang }}>{t("agent.newBooking")}</Link></Button>
          <Button variant="outline" className="rounded-full" onClick={signOut}>{t("auth.signout")}</Button>
        </div>
      </div>

      {(list.error || me.error) && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{((list.error ?? me.error) as Error).message}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {(["pending", "payable", "paid"] as const).map((k) => (
          <div key={k} className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">{t(`agent.tiles.${k}`)}</p><p className="mt-1 font-display text-2xl text-maroon">{formatINR(totals?.[k] ?? 0)}</p></div>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl text-maroon">{t("agent.myBookings")}</h2>
      {list.isLoading ? <p className="mt-3">{t("common.loading")}</p> : rows.length === 0 ? (
        <div className="mt-3 rounded-2xl border bg-card p-8 text-center"><p>{t("agent.empty")}</p></div>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.map((b) => {
            const due = Number(b.total) - Number(b.paid);
            const awaiting = Number(b.awaiting);
            const canPay = ["pending_payment", "partially_paid"].includes(b.status) && due - awaiting > 0;
            return (
              <div key={b.id} className="space-y-1 rounded-2xl border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg text-maroon">{loc({ title_en: b.yatra_en, title_hi: b.yatra_hi }, "title", lang)}</p><Badge variant={b.status === "confirmed" ? "default" : "outline"}>{t(`account.status.${b.status}`)}</Badge></div>
                <p>{t("agent.col.booking")}: <b>{b.code}</b>{b.start_date ? ` · ${formatDate(b.start_date, lang)}` : ""} · {b.adults + b.children + b.infants} {t("account.travellers").toLowerCase()}</p>
                <p>{t("agent.col.customer")}: {b.customer} {b.mobile && `· ${b.mobile}`}</p>
                <p>{t("agent.col.total")}: {formatINR(Number(b.total))} · {t("agent.col.paid")}: {formatINR(Number(b.paid))}{due > 0 && !["cancelled", "refunded"].includes(b.status) ? ` · ${t("account.due")}: ${formatINR(due)}` : ""}</p>
                <p>{t("agent.col.commission")}: <b>{formatINR(Number(b.c_amount))}</b> ({Number(b.c_rate)}%) <Badge variant={b.c_status === "payable" ? "default" : b.c_status === "clawback" ? "destructive" : "outline"}>{t(`agent.commission.${b.c_status}`)}</Badge></p>
                {awaiting > 0 && <p className="text-muted-foreground">{t("agent.awaiting", { amount: formatINR(awaiting) })}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm" className="rounded-full"><Link to="/$lang/booking/$code" params={{ lang, code: b.code }}>{t("agent.voucher")}</Link></Button>
                  {canPay && <Button size="sm" variant="outline" className="rounded-full" onClick={() => setPay({ bookingId: b.id, code: b.code, amount: String(due - awaiting), method: "upi", reference: "" })}>{t("agent.recordPayment")}</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("agent.recordTitle")} · {pay?.code}</DialogTitle></DialogHeader>
          {pay && <div className="space-y-3">
            <div className="space-y-1"><Label>{t("agent.amount")}</Label><Input type="number" inputMode="numeric" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} className="h-11" /></div>
            <div className="space-y-1"><Label>{t("agent.method")}</Label><select className="h-11 w-full rounded-md border bg-background px-3" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{AGENT_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(`agent.methods.${m}`)}</option>)}</select></div>
            <div className="space-y-1"><Label>{t("agent.reference")}</Label><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} className="h-11" /></div>
            <p className="text-xs text-muted-foreground">{t("agent.recordNote")}</p>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setPay(null)}>{t("agent.cancel")}</Button><Button onClick={submitPayment} disabled={busy || !pay?.amount || !pay?.reference.trim()}>{t("agent.submit")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
