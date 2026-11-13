import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGrid, SlabsEditor, type FieldDef, type Row } from "@/components/admin/fields";
import { toast } from "sonner";
import { audit, errMsg } from "@/lib/admin-client";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: ({ context }) => { if (!context.me.isAdmin) throw redirect({ to: "/admin" }); },
  component: Settings,
});

const BRAND: FieldDef[] = [
  { key: "brand_name", label: "Company name", type: "bi" }, { key: "tagline", label: "Tagline", type: "bi" },
  { key: "logo_url", label: "Logo", type: "image" }, { key: "favicon_url", label: "Favicon", type: "image" },
];
const CONTACT: FieldDef[] = [
  { key: "phone", label: "Phone", type: "text" }, { key: "whatsapp", label: "WhatsApp number", type: "text" }, { key: "email", label: "Email", type: "text" },
  { key: "address", label: "Address", type: "bitext" }, { key: "video_url", label: "Home video (YouTube URL)", type: "text" }, { key: "about", label: "About us text", type: "bitext" },
];
const MONEY: FieldDef[] = [
  { key: "gst_number", label: "GST number", type: "text" }, { key: "gst_percent", label: "GST %", type: "number" },
  { key: "default_advance_type", label: "Default advance type", type: "select", options: [{ value: "fixed", label: "Fixed ₹ per person" }, { value: "percent", label: "Percent of total" }] },
  { key: "default_advance_value", label: "Default advance value", type: "number" },
  { key: "razorpay_mode", label: "Razorpay mode", type: "select", options: [{ value: "test", label: "Test" }, { value: "live", label: "Live" }] },
  { key: "email_sender_name", label: "Email sender name", type: "text" },
];

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "settings"], queryFn: async () => (await supabase.from("site_settings").select("*").eq("id", 1).single()).data });
  const [s, setS] = useState<Row | null>(null);
  useEffect(() => { if (data) setS({ ...data }); }, [data]);
  if (!s) return <p>Loading…</p>;
  const set = (p: Row) => setS((x) => ({ ...x!, ...p }));
  const slabs: { min_days: number; refund_percent: number }[] = s.cancellation_slabs ?? [];
  const social: Record<string, string> = s.social ?? {};
  const counters: Record<string, number> = s.counters ?? {};
  async function save() {
    const sorted = [...slabs].sort((a, b) => b.min_days - a.min_days);
    if (sorted.some((x) => x.refund_percent < 0 || x.refund_percent > 100)) return toast.error("Refund % must be 0–100");
    const { id, updated_at, ...payload } = { ...s!, cancellation_slabs: sorted };
    const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
    if (error) return toast.error(errMsg(error));
    await audit("update", "site_settings", "1");
    toast.success("Settings saved");
    qc.invalidateQueries();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="font-display text-2xl text-secondary">Settings</h1><Button onClick={save}>Save settings</Button></div>
      <Card><CardHeader><CardTitle className="text-base">Brand</CardTitle></CardHeader><CardContent><FieldGrid fields={BRAND} row={s} set={set} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Contact & about</CardTitle></CardHeader><CardContent><FieldGrid fields={CONTACT} row={s} set={set} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Social links</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
        {["facebook", "instagram", "youtube", "twitter"].map((k) => <label key={k} className="text-sm capitalize">{k}<Input className="mt-1" value={social[k] ?? ""} onChange={(e) => set({ social: { ...social, [k]: e.target.value } })} /></label>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Home page counters</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4">
        {["yatras", "places", "years", "yatris"].map((k) => <label key={k} className="text-sm capitalize">{k}<Input type="number" className="mt-1" value={counters[k] ?? 0} onChange={(e) => set({ counters: { ...counters, [k]: Number(e.target.value) } })} /></label>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Payments & tax</CardTitle></CardHeader><CardContent><FieldGrid fields={MONEY} row={s} set={set} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Default cancellation slabs</CardTitle></CardHeader><CardContent className="space-y-2">
        <SlabsEditor slabs={slabs} onChange={(v) => set({ cancellation_slabs: v })} />
      </CardContent></Card>
    </div>
  );
}

