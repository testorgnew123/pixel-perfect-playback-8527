import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getYatraLookups, listYatraVersions } from "@/lib/admin-misc.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { toast } from "sonner";
import { FieldGrid, RowsEditor, SlabsEditor, type FieldDef, type Row } from "@/components/admin/fields";
import { DeparturesManager } from "@/components/admin/DeparturesManager";
import { blankYatra, loadYatra, saveYatra, type YatraState } from "@/components/admin/yatra-data";
import { errMsg } from "@/lib/admin-client";

export const Route = createFileRoute("/admin/yatras/$id")({ component: YatraEditor });

const BASIC: FieldDef[] = [
  { key: "title", label: "Title", type: "bi", required: true },
  { key: "slug", label: "URL slug", type: "text", required: true, placeholder: "char-dham-yatra" },
  { key: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }] },
  { key: "short_desc", label: "Short description", type: "bi" },
  { key: "overview", label: "Overview", type: "bitext" },
  { key: "highlights", label: "Highlights", type: "bilist" },
  { key: "starting_city", label: "Starting city", type: "bi" },
  { key: "states", label: "States covered", type: "list" },
  { key: "duration_days", label: "Days", type: "number" },
  { key: "duration_nights", label: "Nights", type: "number" },
  { key: "transport", label: "Transport (bus, train, flight, tempo)", type: "list" },
  { key: "difficulty", label: "Difficulty", type: "select", options: ["easy", "moderate", "difficult"].map((v) => ({ value: v, label: v })) },
  { key: "min_age", label: "Minimum age", type: "number" },
  { key: "tags", label: "Tags", type: "list" },
  { key: "senior_friendly", label: "Senior-citizen friendly", type: "bool" },
  { key: "featured", label: "Featured on home page", type: "bool" },
  { key: "offer", label: "Special offer", type: "bool" },
  { key: "offer_ends_at", label: "Offer ends", type: "datetime" },
];
const DAY: FieldDef[] = [
  { key: "title", label: "Title", type: "bi" }, { key: "description", label: "Description", type: "bitext" },
  { key: "meals", label: "Meals (breakfast, lunch, dinner)", type: "list" }, { key: "overnight", label: "Overnight stay", type: "bi" }, { key: "image_url", label: "Image", type: "image" },
];
const PRICE_TOP: FieldDef[] = [{ key: "price", label: "Starting price ₹ (shown on cards)", type: "number" }, { key: "original_price", label: "Original price ₹ (strike-through)", type: "number" }];
const PRICING: FieldDef[] = ["quad", "triple", "twin", "single", "child", "infant"].map((k) => ({ key: k, label: `${k[0]!.toUpperCase() + k.slice(1)} ${["child", "infant"].includes(k) ? "" : "sharing "}₹ per person`, type: "number" as const }));
const ADDON: FieldDef[] = [{ key: "name", label: "Name", type: "bi" }, { key: "price", label: "Price ₹", type: "number" }, { key: "per_person", label: "Charged per person", type: "bool" }];
const PICKUP: FieldDef[] = [{ key: "city", label: "City", type: "bi" }, { key: "extra_charge", label: "Extra charge ₹ per person", type: "number" }, { key: "reporting_time", label: "Reporting time", type: "text" }, { key: "reporting_place", label: "Reporting place", type: "bi" }];
const ITEM: FieldDef[] = [{ key: "text", label: "Text", type: "bi" }];
const IMAGE: FieldDef[] = [{ key: "url", label: "Image", type: "image" }, { key: "alt", label: "Alt text", type: "bi" }];
const MEDIA: FieldDef[] = [{ key: "cover_image", label: "Cover image", type: "image" }, { key: "video_url", label: "YouTube video URL", type: "text" }, { key: "brochure_url", label: "Brochure PDF", type: "file" }, { key: "map_embed_url", label: "Google Map embed URL", type: "text", wide: true }];
const FAQ: FieldDef[] = [{ key: "question", label: "Question", type: "bi" }, { key: "answer", label: "Answer", type: "bitext" }];
const POLICY: FieldDef[] = [
  { key: "gst_percent", label: "GST %", type: "number" }, { key: "gst_inclusive", label: "Prices include GST", type: "bool" },
  { key: "advance_type", label: "Advance type", type: "select", options: [{ value: "fixed", label: "Fixed ₹ per person" }, { value: "percent", label: "Percent of total" }] },
  { key: "advance_value", label: "Advance value", type: "number" },
];
const SEO: FieldDef[] = [{ key: "meta_title", label: "SEO title", type: "bi" }, { key: "meta_desc", label: "SEO description", type: "bitext" }, { key: "og_image", label: "Social share image", type: "image" }];
const KINDS = [["inclusion", "Inclusions"], ["exclusion", "Exclusions"], ["carry", "Things to carry"], ["note", "Important notes"]] as const;

function YatraEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [st, setSt] = useState<YatraState | null>(isNew ? blankYatra() : null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const lookupsFn = useServerFn(getYatraLookups);
  const { data: lookups } = useQuery({ queryKey: ["admin", "yatra-lookups"], queryFn: () => lookupsFn() });
  useEffect(() => {
    if (isNew) { setSt(blankYatra()); return; }
    loadYatra(id).then(setSt).catch((e) => toast.error(errMsg(e)));
  }, [id, isNew]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!st) return <p>Loading…</p>;
  const up = (patch: Partial<YatraState>) => { setSt((s) => ({ ...s!, ...patch })); setDirty(true); };
  const setY = (p: Row) => up({ y: { ...st.y, ...p } });

  async function save(status?: string) {
    setSaving(true);
    try {
      const next = status ? { ...st!, y: { ...st!.y, status } } : st!;
      if (!next.y.slug && next.y.title_en) next.y.slug = String(next.y.title_en).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const yid = await saveYatra(next);
      setDirty(false);
      toast.success("Yatra saved");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["public"] });
      if (isNew) navigate({ to: "/admin/yatras/$id", params: { id: yid }, replace: true });
      else setSt(await loadYatra(yid));
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  }

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const itemsOf = (k: string) => st.items.filter((i) => i.kind === k);
  const setItems = (k: string, rows: Row[]) => up({ items: [...st.items.filter((i) => i.kind !== k), ...rows.map((r) => ({ ...r, kind: k }))] });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link to="/admin/yatras"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="mr-auto font-display text-xl text-maroon">{st.y.title_en || "New yatra"} <Badge variant={st.y.status === "published" ? "default" : "outline"} className="ml-1 align-middle">{st.y.status}</Badge>{dirty && <span className="ml-2 text-sm text-muted-foreground">• unsaved</span>}</h1>
        {!isNew && <Button variant="outline" size="sm" onClick={() => setShowVersions(true)}><History className="mr-1 h-4 w-4" />Versions</Button>}
        {!isNew && <Button variant="outline" size="sm" asChild><a href={`/hi/yatras/${st.y.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Preview</a></Button>}
        <Button variant="secondary" onClick={() => save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        {st.y.status !== "published" && <Button onClick={() => save("published")} disabled={saving}>Publish</Button>}
      </div>
      <Tabs defaultValue="basic">
        <TabsList className="h-auto flex-wrap justify-start">
          {[["basic", "1. Basic"], ["itinerary", "2. Itinerary"], ["pricing", "3. Pricing"], ["extras", "4. Pickup & add-ons"], ["inclusions", "5. Inclusions"], ["media", "6. Photos & media"], ["departures", "7. Departures"], ["faqs", "8. FAQs"], ["seo", "9. Policies & SEO"]].map(([v, l]) => <TabsTrigger key={v} value={v!}>{l}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="basic"><Card><CardContent className="space-y-6 p-4">
          <FieldGrid fields={BASIC} row={st.y} set={setY} />
          <div><p className="mb-2 text-sm font-medium">Yatra types</p><div className="flex flex-wrap gap-2">{lookups?.cats.map((c) => <button type="button" key={c.id} onClick={() => up({ cats: toggle(st.cats, c.id) })}><Badge variant={st.cats.includes(c.id) ? "default" : "outline"}>{c.name_en}</Badge></button>)}</div></div>
          <div><p className="mb-2 text-sm font-medium">Destinations</p><div className="flex flex-wrap gap-2">{lookups?.dests.map((c) => <button type="button" key={c.id} onClick={() => up({ dests: toggle(st.dests, c.id) })}><Badge variant={st.dests.includes(c.id) ? "default" : "outline"}>{c.name_en}</Badge></button>)}</div></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="itinerary"><RowsEditor rows={st.days} onChange={(days) => up({ days })} fields={DAY} blank={() => ({ meals: [] })} title={(r, i) => `Day ${i + 1}${r.title_en ? ` – ${r.title_en}` : ""}`} /></TabsContent>
        <TabsContent value="pricing"><Card><CardContent className="space-y-6 p-4">
          <FieldGrid fields={PRICE_TOP} row={st.y} set={setY} />
          <p className="text-sm font-medium">Per-person price by room sharing</p>
          <FieldGrid fields={PRICING} row={st.pricing} set={(p) => up({ pricing: { ...st.pricing, ...p } })} />
        </CardContent></Card></TabsContent>
        <TabsContent value="extras" className="space-y-6">
          <div><h2 className="mb-2 font-medium">Pickup cities</h2><RowsEditor rows={st.pickups} onChange={(pickups) => up({ pickups })} fields={PICKUP} blank={() => ({ extra_charge: 0 })} title={(r) => r.city_en || "New city"} /></div>
          <div><h2 className="mb-2 font-medium">Optional add-ons</h2><RowsEditor rows={st.addons} onChange={(addons) => up({ addons })} fields={ADDON} blank={() => ({ price: 0, per_person: true })} title={(r) => r.name_en || "New add-on"} /></div>
        </TabsContent>
        <TabsContent value="inclusions" className="space-y-6">
          {KINDS.map(([k, label]) => <div key={k}><h2 className="mb-2 font-medium">{label}</h2><RowsEditor rows={itemsOf(k)} onChange={(r) => setItems(k, r)} fields={ITEM} blank={() => ({ kind: k })} title={(r) => r.text_en || "New item"} /></div>)}
        </TabsContent>
        <TabsContent value="media" className="space-y-6">
          <Card><CardContent className="p-4"><FieldGrid fields={MEDIA} row={st.y} set={setY} /></CardContent></Card>
          <div><h2 className="mb-2 font-medium">Photo gallery (images are converted to WebP automatically)</h2><RowsEditor rows={st.images} onChange={(images) => up({ images })} fields={IMAGE} blank={() => ({})} title={(_, i) => `Photo ${i + 1}`} /></div>
        </TabsContent>
        <TabsContent value="departures">{isNew ? <p className="text-muted-foreground">Save the yatra first to add departures.</p> : <DeparturesManager yatraId={id} />}</TabsContent>
        <TabsContent value="faqs"><RowsEditor rows={st.faqs} onChange={(faqs) => up({ faqs })} fields={FAQ} blank={() => ({})} title={(r) => r.question_en || "New question"} /></TabsContent>
        <TabsContent value="seo"><Card><CardContent className="space-y-6 p-4">
          <FieldGrid fields={POLICY} row={st.y} set={setY} />
          <div><p className="mb-2 text-sm font-medium">Cancellation slabs for this yatra (leave empty to use the default from Settings)</p><SlabsEditor slabs={st.y.cancellation_slabs ?? []} onChange={(v) => setY({ cancellation_slabs: v.length ? v : null })} /></div>
          <FieldGrid fields={SEO} row={st.y} set={setY} />
        </CardContent></Card></TabsContent>
      </Tabs>
      {!isNew && <VersionsDialog open={showVersions} onClose={() => setShowVersions(false)} yatraId={id} onRestore={(snap) => { setSt(snap); setDirty(true); setShowVersions(false); toast.info("Version loaded — click Save to restore it"); }} />}
    </div>
  );
}

function VersionsDialog({ open, onClose, yatraId, onRestore }: { open: boolean; onClose: () => void; yatraId: string; onRestore: (s: YatraState) => void }) {
  const versionsFn = useServerFn(listYatraVersions);
  const { data = [] } = useQuery({
    queryKey: ["admin", "versions", yatraId, open],
    enabled: open,
    queryFn: () => versionsFn({ data: { yatraId } }),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Last 10 saved versions</DialogTitle></DialogHeader>
        <div className="divide-y">
          {data.map((v, i) => (
            <div key={v.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>{new Date(v.created_at).toLocaleString("en-IN")} {i === 0 && <Badge variant="outline">current</Badge>}<br /><span className="text-muted-foreground">{v.who}</span></span>
              {i > 0 && <Button size="sm" variant="outline" onClick={() => onRestore(v.snapshot as unknown as YatraState)}>Load</Button>}
            </div>
          ))}
          {data.length === 0 && <p className="py-4 text-muted-foreground">No versions yet — one is saved every time you click Save.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
