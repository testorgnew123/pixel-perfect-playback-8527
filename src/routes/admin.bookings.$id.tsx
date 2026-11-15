import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { adminCancelBooking, getBookingDetail, getRefundPreview, markRefundPaid, recordPayment } from "@/lib/booking.functions";
import { errMsg } from "@/lib/admin-client";

export const Route = createFileRoute("/admin/bookings/$id")({ component: BookingDetail });

function BookingDetail() {
  const { id } = Route.useParams();
  const { me } = Route.useRouteContext();
  const qc = useQueryClient();
  const detail = useServerFn(getBookingDetail);
  const pay = useServerFn(recordPayment);
  const preview = useServerFn(getRefundPreview);
  const cancel = useServerFn(adminCancelBooking);
  const refundDone = useServerFn(markRefundPaid);
  const { data } = useQuery({ queryKey: ["admin", "booking", id], queryFn: () => detail({ data: { bookingId: id } }) });
  const [p, setP] = useState({ amount: "", method: "upi", notes: "" });
  const [cx, setCx] = useState<{ percent: number; amount: number; days: number; paid: number } | null>(null);
  const [override, setOverride] = useState("");
  const [reason, setReason] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  if (!data?.booking) return <p>Loading…</p>;
  const b = data.booking as any;
  // `data` is typed `{}` in this file (existing serialization typing issue), so type the new field explicitly.
  const agent = (data as { agent?: { name: string; email: string; commission: { amount: number; rate: number; status: string } | null } | null }).agent ?? null;
  const c = b.contact as { name?: string; mobile?: string; email?: string; city?: string };
  const due = Number(b.total_amount) - Number(b.amount_paid);
  const closed = ["cancelled", "refunded"].includes(b.status);
  async function addPayment() {
    try { await pay({ data: { bookingId: id, amount: Number(p.amount), method: p.method, notes: p.notes } }); toast.success("Payment recorded"); setP({ amount: "", method: "upi", notes: "" }); refresh(); } catch (e) { toast.error(errMsg(e)); }
  }
  async function openCancel() { try { setCx(await preview({ data: { bookingId: id } })); setOverride(""); } catch (e) { toast.error(errMsg(e)); } }
  async function doCancel() {
    try { const r = await cancel({ data: { bookingId: id, reason, refundOverride: override === "" ? null : Number(override) } }); toast.success(`Cancelled. Refund ₹${r.refund}${r.offered ? `, ${r.offered} waitlist offer(s) made` : ""}`); setCx(null); refresh(); } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link to="/admin/bookings"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="mr-auto font-display text-2xl text-maroon">{b.booking_code} <Badge variant="outline" className="align-middle">{b.status.replace(/_/g, " ")}</Badge></h1>
        <Button variant="outline" size="sm" asChild><a href={`/en/booking/${b.booking_code}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Voucher / invoice</a></Button>
        {me.isAdmin && !closed && <Button variant="destructive" size="sm" onClick={openCancel}>Cancel booking</Button>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Trip & customer</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
          <p><b>{b.yatras?.title_en}</b></p><p>{b.departures?.start_date} → {b.departures?.end_date}</p>
          <p>{b.adults} adults, {b.children} children, {b.infants} infants · {b.sharing} sharing{data.pickup ? ` · pickup ${data.pickup}` : ""}</p>
          <p>{c.name} · {c.mobile} · {c.email} · {c.city}</p>
          <p className="text-muted-foreground">Booked {new Date(b.created_at).toLocaleString("en-IN")} {agent ? "by an agent" : b.user_id ? "online" : "manually"}{b.coupon_code ? ` · coupon ${b.coupon_code}` : ""}</p>
          {agent && <p>Agent: <b>{agent.name}</b> ({agent.email}){agent.commission && <> · commission ₹{agent.commission.amount} ({agent.commission.rate}% of pre-GST) · <Badge variant="outline" className="align-middle">{agent.commission.status}</Badge></>}</p>}
          {b.internal_notes && <p className="rounded bg-muted p-2">{b.internal_notes}</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Amounts</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
          <p>Fare ₹{b.base_amount} · Add-ons ₹{b.addons_amount} · Pickup ₹{b.pickup_amount}</p>
          <p>Discount ₹{b.discount_amount} · GST ₹{b.gst_amount}</p>
          <p className="text-lg font-semibold">Total ₹{b.total_amount} · Paid ₹{b.amount_paid}{closed ? "" : ` · Due ₹${Math.max(0, due)}`}</p>
          {Number(b.refund_amount) > 0 && <p>Refund ₹{b.refund_amount}</p>}
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Travellers {!data.isAdmin && <span className="text-sm font-normal text-muted-foreground">(ID numbers and medical info visible to admins only)</span>}</CardTitle></CardHeader><CardContent>
        <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th className="p-1">Name</th><th className="p-1">Age</th><th className="p-1">Gender</th><th className="p-1">ID</th><th className="p-1">Meal</th><th className="p-1">Medical</th></tr></thead>
          <tbody>{data.travellers.map((t: any) => <tr key={t.id} className="border-t"><td className="p-1">{t.full_name} ({t.traveller_type})</td><td className="p-1">{t.age}</td><td className="p-1">{t.gender}</td><td className="p-1">{t.id_type} {t.id_number ?? (t.id_last4 ? `XXXX${t.id_last4}` : "")}</td><td className="p-1">{t.meal_pref}</td><td className="p-1">{t.medical_condition}</td></tr>)}</tbody></table>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Payments</CardTitle></CardHeader><CardContent className="space-y-3">
        {data.payments.map((x: any) => <p key={x.id} className="text-sm">{new Date(x.created_at).toLocaleString("en-IN")} · ₹{x.amount} · {x.method} {x.notes && `· ${x.notes}`} {x.status !== "captured" && <Badge variant="outline" className="align-middle">{String(x.status).replace(/_/g, " ")}</Badge>}</p>)}
        {!closed && due > 0 && <div className="flex flex-wrap gap-2">
          <Input type="number" placeholder={`Amount (due ₹${due})`} value={p.amount} onChange={(e) => setP({ ...p, amount: e.target.value })} className="w-44" />
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={p.method} onChange={(e) => setP({ ...p, method: e.target.value })}>{["upi", "cash", "bank_transfer", "cheque", "card"].map((m) => <option key={m}>{m}</option>)}</select>
          <Input placeholder="Reference / notes" value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} className="w-56" />
          <Button onClick={addPayment} disabled={!p.amount}>Record payment</Button>
        </div>}
      </CardContent></Card>
      {data.refunds.length > 0 && <Card><CardHeader><CardTitle className="text-base">Refunds</CardTitle></CardHeader><CardContent className="space-y-2">
        {data.refunds.map((r: any) => <div key={r.id} className="flex items-center gap-3 text-sm"><span className="flex-1">₹{r.amount} · {r.status} · {r.reason}</span>{me.isAdmin && r.status === "pending" && <Button size="sm" onClick={async () => { const ref = window.prompt("Refund reference (UTR / cheque no.)") ?? ""; try { await refundDone({ data: { refundId: r.id, reference: ref } }); toast.success("Marked refunded"); refresh(); } catch (e) { toast.error(errMsg(e)); } }}>Mark refund paid</Button>}</div>)}
      </CardContent></Card>}
      <Dialog open={!!cx} onOpenChange={(o) => !o && setCx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel {b.booking_code}</DialogTitle></DialogHeader>
          {cx && <div className="space-y-3 text-sm">
            <p>{cx.days} days before departure → policy refund <b>{cx.percent}%</b> of ₹{cx.paid} paid = <b>₹{cx.amount}</b>.</p>
            <label className="block">Refund amount (leave blank to use policy)<Input type="number" value={override} onChange={(e) => setOverride(e.target.value)} placeholder={String(cx.amount)} /></label>
            <label className="block">Reason<Input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <p className="text-muted-foreground">Seats will be released and offered to the waitlist automatically.</p>
          </div>}
          <DialogFooter><Button variant="destructive" onClick={doCancel}>Confirm cancellation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
