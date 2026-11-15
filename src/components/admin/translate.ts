import { translateBatch } from "@/lib/translate.functions";
import type { FieldDef, Row } from "./fields";

type Group = { rows: Row[]; fields: FieldDef[] };
type Job = { g: number; r: number; key: string; list: boolean; lines: string[]; from: "en" | "hi" };

const BILINGUAL = ["bi", "bitext", "bilist"];

/** For every bilingual field where exactly one language is filled, translates it into the empty one.
 * Returns one patch per row (same shape as `groups`) and how many fields were translated. Never overwrites text. */
export async function translateMissing(groups: Group[]): Promise<{ patches: Row[][]; count: number }> {
  const jobs: Job[] = [];
  groups.forEach((grp, g) => grp.rows.forEach((row, r) => grp.fields.forEach((f) => {
    if (!BILINGUAL.includes(f.type)) return;
    const list = f.type === "bilist";
    const norm = (v: unknown): string[] => (list ? ((v as unknown[]) ?? []).map(String).filter((s) => s.trim()) : String(v ?? "").trim() ? [String(v)] : []);
    const en = norm(row[`${f.key}_en`]);
    const hi = norm(row[`${f.key}_hi`]);
    if (en.length && !hi.length) jobs.push({ g, r, key: `${f.key}_hi`, list, lines: en, from: "en" });
    else if (hi.length && !en.length) jobs.push({ g, r, key: `${f.key}_en`, list, lines: hi, from: "hi" });
  })));

  const patches: Row[][] = groups.map((grp) => grp.rows.map(() => ({})));
  if (!jobs.length) return { patches, count: 0 };

  const out = await translateBatch({ data: { items: jobs.flatMap((j) => j.lines.map((text) => ({ text, from: j.from }))) } });
  let k = 0;
  for (const j of jobs) {
    const t = out.slice(k, k + j.lines.length);
    k += j.lines.length;
    patches[j.g]![j.r]![j.key] = j.list ? t : t[0];
  }
  return { patches, count: jobs.length };
}
