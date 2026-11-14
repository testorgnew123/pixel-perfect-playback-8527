import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminCreateBooking, adminQuote, type TravellerIn } from "@/lib/booking.functions";
import { listOpenDepartures } from "@/lib/admin-misc.functions";
import type { Sharing } from "@/lib/pricing";
import { errMsg } from "@/lib/admin-client";

export type ManualPrefill = { departureId?: string; name?: string; mobile?: string; email?: string; seats?: number; waitlistId?: string };

export function ManualBooking({ open, onClose, prefill, onDone }: { open: boolean; onClose: () => void; prefill?: ManualPrefill | undefined; onDone: () => void }) {
  const quoteFn = useServerFn(adminQuote);
  const createFn = useServerFn(adminCreateBooking);
  const openDepsFn = useServerFn(listOpenDepartures);
  const { data: deps = [] } = useQuery({ queryKey: ["admin", "deps-open"], enabled: open, queryFn: () => openDepsFn() });
  const [dep, setDep] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [sharing, setSharing] = useState<Sharing>("twin");
  const [coupon, setCoupon] = useState("");
  const [contact, setContact] = useState({ name: "", mobile: "", email: "", city: "" });
  const [tr, setTr] = useState<TravellerIn[]>([]);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof adminQuote>> | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setDep(prefill?.departureId ?? ""); setAdults(prefill?.seats ?? 1); setChildren(0); setCoupon(""); setNotes(""); setConsent(false);
    setContact({ name: prefill?.name ?? "", mobile: prefill?.mobile ?? "", email: prefill?.email ?? "", city: "" });
  }, [open, prefill]);
  useEffect(() => {
    setTr((p) => [...Array(adults + children)].map((_, i) => p[i] ?? { traveller_type: i < adults ? "adult" : "child", full_name: i === 0 ? contact.name : "", age: null, gender: "" }).map((x, i) => ({ ...x, traveller_type: i < adults ? "adult" : "child" })));
  }, [adults, children]); // eslint-disable-line react-hooks/exhaustive-deps
  const req = { departureId: dep, adults, children, infants: 0, sharing, pickupCityId: null, addonIds: [], couponCode: coupon || null };
  useEffect(() => {
    if (!dep) return setQuote(null);
    quoteFn({ data: req }).then(setQuote).catch((e) => toast.error(errMsg(e)));
  }, [dep, adults, children, sharing, coupon]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit() {
    if (!dep || !consent || tr.some((x) => !x.full_name.trim())) return void toast.error("Departure, traveller names and consent are required");
    setBusy(true);
    try {
      const r = await createFn({ data: { ...req, travellers: tr, contact, consent, lang: "hi", notes, waitlistId: prefill?.waitlistId } });
      if (!r.ok) return void toast.error("Not enough seats");
      toast.success(`Booking ${r.code} created`); onDone(); onClose();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Manual booking</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <select className="h-10 w-full rounded-md border bg-background px-2" value={dep} onChange={(e) => setDep(e.target.value)}><option value="">Select departure…</option>{deps.map((d: any) => <option key={d.id} value={d.id}>{d.start_date} · {d.yatra?.title_en} ({d.total_seats - d.booked_seats} left)</option>)}</select>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">Adults<Input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} /></label>
            <label className="text-sm">Children<Input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))} /></label>
            <label className="text-sm">Sharing<select className="h-9 w-full rounded-md border bg-background px-2" value={sharing} onChange={(e) => setSharing(e.target.value as Sharing)}>{["quad", "triple", "twin", "single"].map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Contact name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            <Input placeholder="Mobile" value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} />
            <Input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            <Input placeholder="City" value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
          </div>
          <Label>Travellers</Label>
          {tr.map((x, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_100px] gap-2">
              <Input placeholder={`Name (${x.traveller_type})`} value={x.full_name} onChange={(e) => setTr(tr.map((y, j) => (j === i ? { ...y, full_name: e.target.value } : y)))} />
              <Input placeholder="Age" type="number" value={x.age ?? ""} onChange={(e) => setTr(tr.map((y, j) => (j === i ? { ...y, age: e.target.value ? Number(e.target.value) : null } : y)))} />
              <select className="h-9 rounded-md border bg-background px-2" value={x.gender} onChange={(e) => setTr(tr.map((y, j) => (j === i ? { ...y, gender: e.target.value } : y)))}><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option></select>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2"><Input placeholder="Coupon (optional)" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /><Input placeholder="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {quote && <p className="rounded-md bg-muted p-2 text-sm">Total <b>₹{quote.total}</b> (GST ₹{quote.gst}{quote.discount ? `, discount ₹${quote.discount}` : ""}) · advance ₹{quote.advance} · {quote.seatsLeft} seats left{quote.couponError ? ` · coupon: ${quote.couponError}` : ""}</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />Customer consented to storing traveller data</label>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Create booking"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
