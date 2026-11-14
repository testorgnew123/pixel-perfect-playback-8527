import { loadYatraAdmin, saveYatraAdmin } from "@/lib/admin-yatra.functions";
import type { Row } from "./fields";

export type YatraState = {
  y: Row; pricing: Row; cats: string[]; dests: string[];
  images: Row[]; days: Row[]; addons: Row[]; pickups: Row[]; items: Row[]; faqs: Row[];
};

export const blankYatra = (): YatraState => ({
  y: { title_en: "", slug: "", status: "draft", duration_days: 1, duration_nights: 0, difficulty: "easy", transport: [], states: [], highlights_en: [], highlights_hi: [], tags: [], gst_percent: 5, gst_inclusive: false, advance_type: "fixed", advance_value: 5000 },
  pricing: {}, cats: [], dests: [], images: [], days: [], addons: [], pickups: [], items: [], faqs: [],
});

export async function loadYatra(id: string): Promise<YatraState> {
  const r = await loadYatraAdmin({ data: { id } });
  return {
    y: r.y as Row, pricing: (r.pricing ?? {}) as Row,
    cats: r.cats.filter((c): c is string => !!c), dests: r.dests.filter((d): d is string => !!d),
    images: r.images as Row[], days: r.days as Row[], addons: r.addons as Row[], pickups: r.pickups as Row[], items: r.items as Row[], faqs: r.faqs as Row[],
  };
}

/** Saves the whole yatra (replacing child rows), records a version snapshot and an audit entry. Returns the yatra id. */
export async function saveYatra(st: YatraState, action = "update"): Promise<string> {
  return saveYatraAdmin({ data: { state: st, action } });
}
