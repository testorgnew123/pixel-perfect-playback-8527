import type { Lang } from "./i18n";

export function formatINR(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return "";
  return "₹" + Math.round(Number(n)).toLocaleString("en-IN");
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

/**
 * Timezone-safe for date-only strings (YYYY-MM-DD).
 * Accepts Date too: `timestamp` columns (blog_posts.published_at, created_at) come back from
 * Drizzle as Date objects, and calling .slice() on one threw during SSR.
 */
export function formatDate(value: string | Date | null | undefined, lang: Lang, withYear = true) {
  if (!value) return "";
  // toISOString() is UTC; date-only strings are already timezone-safe and pass through as-is.
  const iso = value instanceof Date ? value.toISOString() : value;
  const [y = 0, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  const mon = (lang === "hi" ? MONTHS_HI : MONTHS_EN)[m - 1];
  return withYear ? `${d} ${mon} ${y}` : `${d} ${mon}`;
}

export function monthLabel(month: number, lang: Lang) {
  return (lang === "hi" ? MONTHS_HI : MONTHS_EN)[month - 1];
}

export function discountPercent(orig?: number | null, price?: number | null) {
  if (!orig || !price || orig <= price) return 0;
  return Math.round(((orig - price) / orig) * 100);
}

/** Pick the language-specific column, falling back to English when Hindi is empty. */
export function loc<T extends Record<string, unknown>>(row: T | null | undefined, field: string, lang: Lang): string {
  if (!row) return "";
  const hi = row[`${field}_hi`] as string | null | undefined;
  const en = row[`${field}_en`] as string | null | undefined;
  if (lang === "hi" && hi && String(hi).trim()) return String(hi);
  return en ? String(en) : (hi ?? "");
}

export function locArr<T extends Record<string, unknown>>(row: T | null | undefined, field: string, lang: Lang): string[] {
  if (!row) return [];
  const hi = row[`${field}_hi`] as string[] | null | undefined;
  const en = row[`${field}_en`] as string[] | null | undefined;
  if (lang === "hi" && hi && hi.length) return hi;
  return en ?? [];
}

export function seatsLeft(d: { total_seats: number; booked_seats: number }) {
  return Math.max(0, d.total_seats - d.booked_seats);
}

export function departureStatus(d: { total_seats: number; booked_seats: number; status: string }) {
  const left = seatsLeft(d);
  if (d.status === "closed" || d.status === "completed") return d.status;
  if (left <= 0) return "sold_out";
  if (left < 10 || d.status === "filling_fast") return "filling_fast";
  return "available";
}

export function telHref(phone?: string | null) {
  return phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "#";
}
export function waHref(number?: string | null, text?: string) {
  const n = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
