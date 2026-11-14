import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listBookingsAdmin, listWaitlistAdmin, closeWaitlistEntry } from "@/lib/admin-misc.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { ManualBooking, type ManualPrefill } from "@/components/admin/ManualBooking";

export const Route = createFileRoute("/admin/bookings/")({ component: Bookings });
const STATUSES = ["pending_payment", "partially_paid", "confirmed", "cancellation_requested", "cancelled", "refunded", "completed"];

function Bookings() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"bookings" | "waitlist">("bookings");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [manual, setManual] = useState<ManualPrefill | null>(null);
  const bookingsFn = useServerFn(listBookingsAdmin);
  const waitlistFn = useServerFn(listWaitlistAdmin);
  const closeWaitlistFn = useServerFn(closeWaitlistEntry);
  const { data = [] } = useQuery({
    queryKey: ["admin", "bookings", status],
    queryFn: () => bookingsFn({ data: { status: status || undefined } }),
  });
  const { data: wl = [] } = useQuery({ queryKey: ["admin", "waitlist"], queryFn: () => waitlistFn() });
  const rows = data.filter((b) => !q || `${b.booking_code} ${JSON.stringify(b.contact)}`.toLowerCase().includes(q.toLowerCase()));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin", "bookings"] }); qc.invalidateQueries({ queryKey: ["admin", "waitlist"] }); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-2xl text-maroon">Bookings</h1>
        <Button variant={tab === "bookings" ? "secondary" : "outline"} size="sm" onClick={() => setTab("bookings")}>Bookings</Button>
        <Button variant={tab === "waitlist" ? "secondary" : "outline"} size="sm" onClick={() => setTab("waitlist")}>Waitlist ({wl.length})</Button>
        <Button onClick={() => setManual({})}><Plus className="mr-1 h-4 w-4" />Manual booking</Button>
      </div>
      {tab === "bookings" ? <>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search code / name / mobile" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="p-2">Code</th><th className="p-2">Customer</th><th className="p-2">Yatra</th><th className="p-2">Pax</th><th className="p-2">Total / Paid</th><th className="p-2">Status</th></tr></thead>
            <tbody>{rows.map((b) => {
              const c = b.contact as { name?: string; mobile?: string };
              return (
                <tr key={b.id} className="border-t hover:bg-muted/50">
                  <td className="p-2"><Link to="/admin/bookings/$id" params={{ id: b.id }} className="font-medium text-primary underline">{b.booking_code}</Link></td>
                  <td className="p-2">{c?.name}<br /><span className="text-muted-foreground">{c?.mobile}</span></td>
                  <td className="p-2">{(b.yatras as any)?.title_en}<br /><span className="text-muted-foreground">{(b.departures as any)?.start_date}</span></td>
                  <td className="p-2">{b.adults + b.children + b.infants}</td>
                  <td className="p-2">₹{b.total_amount}<br /><span className="text-muted-foreground">₹{b.amount_paid}</span></td>
                  <td className="p-2"><Badge variant={b.status === "confirmed" ? "default" : b.status === "cancellation_requested" ? "destructive" : "outline"}>{b.status.replace(/_/g, " ")}</Badge></td>
                </tr>
              );
            })}</tbody>
          </table>
          {rows.length === 0 && <p className="p-6 text-center text-muted-foreground">No bookings.</p>}
        </div>
      </> : (
        <div className="divide-y rounded-lg border bg-card">
          {wl.map((w: any) => {
            const free = (w.departure?.total_seats ?? 0) - (w.departure?.booked_seats ?? 0);
            return (
              <div key={w.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="flex-1"><p className="font-medium">{w.name} · {w.mobile} · {w.seats} seat(s)</p><p className="text-sm text-muted-foreground">{w.departure?.yatra?.title_en} · {w.departure?.start_date} · {free} seats free</p></div>
                <Badge variant={w.status === "offered" ? "default" : "outline"}>{w.status}{w.offered_until ? ` until ${new Date(w.offered_until).toLocaleString("en-IN")}` : ""}</Badge>
                <Button size="sm" disabled={free < w.seats} onClick={() => setManual({ departureId: w.departure_id, name: w.name, mobile: w.mobile, email: w.email, seats: w.seats, waitlistId: w.id })}>Convert to booking</Button>
                <Button size="sm" variant="ghost" onClick={async () => { await closeWaitlistFn({ data: { id: w.id } }); refresh(); }}>Remove</Button>
              </div>
            );
          })}
          {wl.length === 0 && <p className="p-6 text-center text-muted-foreground">Waitlist is empty.</p>}
        </div>
      )}
      <ManualBooking open={!!manual} prefill={manual ?? undefined} onClose={() => setManual(null)} onDone={refresh} />
    </div>
  );
}
