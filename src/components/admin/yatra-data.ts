import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin-client";
import type { Row } from "./fields";

export type YatraState = {
  y: Row; pricing: Row; cats: string[]; dests: string[];
  images: Row[]; days: Row[]; addons: Row[]; pickups: Row[]; items: Row[]; faqs: Row[];
};

export const blankYatra = (): YatraState => ({
  y: { title_en: "", slug: "", status: "draft", duration_days: 1, duration_nights: 0, difficulty: "easy", transport: [], states: [], highlights_en: [], highlights_hi: [], tags: [], gst_percent: 5, gst_inclusive: false, advance_type: "fixed", advance_value: 5000 },
  pricing: {}, cats: [], dests: [], images: [], days: [], addons: [], pickups: [], items: [], faqs: [],
});

const CHILD = { images: "yatra_images", days: "yatra_itinerary_days", addons: "yatra_addons", pickups: "yatra_pickup_cities", items: "yatra_list_items", faqs: "yatra_faqs" } as const;

export async function loadYatra(id: string): Promise<YatraState> {
  const sel = (t: string) => (supabase.from(t as any) as any).select("*").eq("yatra_id", id);
  const [y, p, c, d, im, dy, ad, pk, it, fq] = await Promise.all([
    supabase.from("yatras").select("*").eq("id", id).single(),
    supabase.from("yatra_pricing").select("*").eq("yatra_id", id).maybeSingle(),
    supabase.from("yatra_categories").select("category_id").eq("yatra_id", id),
    supabase.from("yatra_destinations").select("destination_id").eq("yatra_id", id),
    sel("yatra_images").order("sort_order"), sel("yatra_itinerary_days").order("day_number"), sel("yatra_addons").order("sort_order"),
    sel("yatra_pickup_cities").order("sort_order"), sel("yatra_list_items").order("sort_order"), sel("yatra_faqs").order("sort_order"),
  ]);
  if (y.error) throw y.error;
  return {
    y: y.data, pricing: p.data ?? {}, cats: (c.data ?? []).map((x) => x.category_id!), dests: (d.data ?? []).map((x) => x.destination_id!),
    images: im.data ?? [], days: dy.data ?? [], addons: ad.data ?? [], pickups: pk.data ?? [], items: it.data ?? [], faqs: fq.data ?? [],
  };
}

const strip = (r: Row) => { const { id, yatra_id, created_at, ...rest } = r; return rest; };

/** Saves the whole yatra (replacing child rows), records a version snapshot and an audit entry. Returns the yatra id. */
export async function saveYatra(st: YatraState, action = "update"): Promise<string> {
  const { id, created_at, updated_at, ...y } = st.y;
  if (!y.title_en?.trim()) throw new Error("English title is required");
  if (!/^[a-z0-9-]+$/.test(y.slug ?? "")) throw new Error("Slug must use lowercase letters, numbers and dashes");
  const res = id ? await supabase.from("yatras").update(y as never).eq("id", id).select("id").single() : await supabase.from("yatras").insert(y as never).select("id").single();
  if (res.error) throw res.error;
  const yid = res.data.id as string;
  const ops: PromiseLike<{ error: unknown }>[] = [];
  const { yatra_id: _p, ...pricing } = st.pricing;
  ops.push(supabase.from("yatra_pricing").upsert({ ...pricing, yatra_id: yid } as never));
  for (const [k, table] of Object.entries(CHILD)) {
    const rows = (st[k as keyof typeof CHILD] as Row[]).map((r, i) => ({ ...strip(r), yatra_id: yid, ...(k === "days" ? { day_number: i + 1 } : { sort_order: i }) }));
    ops.push((async () => {
      const del = await (supabase.from(table as any) as any).delete().eq("yatra_id", yid);
      if (del.error) return del;
      return rows.length ? await (supabase.from(table as any) as any).insert(rows) : { error: null };
    })());
  }
  ops.push((async () => {
    await supabase.from("yatra_categories").delete().eq("yatra_id", yid);
    return st.cats.length ? await supabase.from("yatra_categories").insert(st.cats.map((c) => ({ yatra_id: yid, category_id: c }))) : { error: null };
  })());
  ops.push((async () => {
    await supabase.from("yatra_destinations").delete().eq("yatra_id", yid);
    return st.dests.length ? await supabase.from("yatra_destinations").insert(st.dests.map((c) => ({ yatra_id: yid, destination_id: c }))) : { error: null };
  })());
  const results = await Promise.all(ops);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("yatra_versions").insert({ yatra_id: yid, snapshot: { ...st, y: { ...st.y, id: yid } } as never, created_by: u.user?.id ?? null });
  await audit(id ? action : "create", "yatras", yid, { title: y.title_en, status: y.status });
  return yid;
}
