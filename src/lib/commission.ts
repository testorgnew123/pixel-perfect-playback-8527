// Pure agent-commission math and the website-email rule. No DB and no env access here:
// agent.server.ts feeds it DB-loaded numbers and the AGENT_EMAIL_DOMAINS value.
export const DEFAULT_COMMISSION_PERCENT = 5;
export const DEFAULT_AGENT_EMAIL_DOMAIN = "harishivshankartirthyatra.com";

export const AGENT_STATUSES = ["invited", "active", "suspended"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];
export const COMMISSION_STATUSES = ["pending", "payable", "paid", "void", "clawback"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
export const AGENT_PAYMENT_METHODS = ["upi", "cash", "bank_transfer", "cheque", "card"] as const;

const r = (n: number) => Math.round(n);

/** Commission on the pre-GST amount (total − GST, after discounts), whole rupees. Percent is clamped to 0–100. */
export function computeCommission(i: { total: number; gst: number; percent: number }) {
  const basis = Math.max(0, r(Number(i.total) - Number(i.gst)));
  const percent = Math.min(100, Math.max(0, Number(i.percent) || 0));
  return { basis, percent, amount: r((basis * percent) / 100) };
}

/** A user-entered percent: 0–100, at most 2 decimals. `undefined` when it is not valid. */
export function parsePercent(v: unknown): number | undefined {
  if (v === null || v === undefined || (typeof v === "string" && !v.trim())) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
  return Math.round(n * 100) / 100;
}

const PLAIN_DOMAIN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Parses AGENT_EMAIL_DOMAINS (comma list). Blank or unset gives the default site domain.
 * Any malformed entry gives [] so every email is rejected (fail closed, never a wildcard). */
export function parseAgentDomains(raw: string | null | undefined): string[] {
  const parts = (raw ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) return [DEFAULT_AGENT_EMAIL_DOMAIN];
  return parts.every((d) => PLAIN_DOMAIN.test(d)) ? [...new Set(parts)] : [];
}

const PRINTABLE_ASCII = /^[\x21-\x7e]+$/;
const LOCAL_PART = /^[a-z0-9._%+-]{1,64}$/;

/** The website-email rule for agents. The domain must EQUAL an allowed domain: no subdomains,
 * no suffix/prefix lookalikes, no trailing dot, ASCII only (so no homoglyphs or Kelvin-sign tricks). */
export function isAllowedAgentEmail(email: unknown, domains: readonly string[]): boolean {
  if (typeof email !== "string" || !domains.length) return false;
  const raw = email.trim();
  if (!PRINTABLE_ASCII.test(raw)) return false;
  const e = raw.toLowerCase();
  const at = e.indexOf("@");
  if (at < 1 || at !== e.lastIndexOf("@")) return false;
  return LOCAL_PART.test(e.slice(0, at)) && domains.includes(e.slice(at + 1));
}

/** Canonical stored form. Call only after isAllowedAgentEmail passed. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
