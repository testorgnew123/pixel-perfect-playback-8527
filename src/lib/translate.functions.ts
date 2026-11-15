import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isStaff } from "@/lib/roles.server";

type Lang = "en" | "hi";

// MyMemory's free anonymous tier: ~500 chars per request and a daily quota per IP.
// Set TRANSLATE_CONTACT_EMAIL (optional) to raise the daily quota.
const MAX_PART = 450;
const MAX_ITEMS = 300;
const MAX_CHARS = 30000;
const CONCURRENCY = 4;

/** Splits one line into <= MAX_PART pieces, on sentence ends first and spaces as a last resort. */
function splitLine(line: string): string[] {
  const pieces: string[] = [];
  let cur = "";
  const push = (s: string) => {
    if (cur && cur.length + 1 + s.length > MAX_PART) { pieces.push(cur); cur = ""; }
    cur = cur ? `${cur} ${s}` : s;
  };
  for (const sentence of line.split(/(?<=[.!?।])\s+/)) {
    if (sentence.length <= MAX_PART) { push(sentence); continue; }
    let rest = sentence;
    while (rest.length > MAX_PART) {
      const cut = rest.lastIndexOf(" ", MAX_PART);
      const at = cut > 0 ? cut : MAX_PART;
      push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) push(rest);
  }
  if (cur) pieces.push(cur);
  return pieces;
}

const decode = (s: string) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

async function translatePart(q: string, from: Lang): Promise<string> {
  const to: Lang = from === "en" ? "hi" : "en";
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", q);
  url.searchParams.set("langpair", `${from}|${to}`);
  const email = process.env["TRANSLATE_CONTACT_EMAIL"];
  if (email) url.searchParams.set("de", email);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const j = (await res.json()) as { responseStatus?: number | string; responseData?: { translatedText?: string } };
  const t = j.responseData?.translatedText;
  if (Number(j.responseStatus) === 429 || (t && /MYMEMORY WARNING/i.test(t))) throw new Error("Free translation quota used up for today. Try again tomorrow or type the translation manually.");
  if (Number(j.responseStatus) !== 200 || !t) throw new Error("Translation service failed. Try again in a moment.");
  return decode(t);
}

async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]!); }
  }));
  return out;
}

/** Translates each item from `from` into the other language (en <-> hi). Staff only. */
export const translateBatch = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { items: { text: string; from: Lang }[] }) => d)
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context.userId))) throw new Error("Staff only");
    const { items } = data;
    if (items.length > MAX_ITEMS || items.reduce((n, i) => n + i.text.length, 0) > MAX_CHARS) throw new Error("Too much text to translate at once.");
    if (items.some((i) => i.from !== "en" && i.from !== "hi")) throw new Error("Unsupported language");

    // Flatten to (item, line, part) so long texts are chunked and all parts share one request pool.
    const plan = items.map((it) => it.text.split("\n").map((line) => (line.trim() ? splitLine(line.trim()) : [])));
    const flat = plan.flatMap((lines, i) => lines.flatMap((parts) => parts.map((p) => ({ i, p }))));
    const translated = await pool(flat, CONCURRENCY, (x) => translatePart(x.p, items[x.i]!.from));
    let k = 0;
    return items.map((it, i) => plan[i]!.map((parts) => parts.map(() => translated[k++]!).join(" ")).join("\n"));
  });
