// Server-only agent helpers: who counts as an agent, the website-email rule wired to env,
// the guarded payment apply, and the commission state changes. Money rules live here once.
import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { auth } from "./auth.server";
import { db } from "./db.server";
import { isStaff } from "./roles.server";
import { DEFAULT_COMMISSION_PERCENT, isAllowedAgentEmail, parseAgentDomains } from "./commission";
import { account as accountTable, agent_commissions, agent_settings, agents, audit_logs, bookings, payments, session as sessionTable, user, userRoles } from "../../drizzle/schema";

type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type AgentRow = typeof agents.$inferSelect;

/** Allowed agent email domains, from AGENT_EMAIL_DOMAINS (default: the website domain). Deploy-level only. */
export const agentDomains = () => parseAgentDomains(process.env["AGENT_EMAIL_DOMAINS"]);
export const agentEmailOk = (email: unknown) => isAllowedAgentEmail(email, agentDomains());

/** Throws unless the email is on an allowed website domain. Used by the admin invite (specific message). */
export function assertAgentEmail(email: string) {
  const domains = agentDomains();
  if (!domains.length) throw new Error("AGENT_EMAIL_DOMAINS is invalid on the server, so agent onboarding is disabled");
  if (!isAllowedAgentEmail(email, domains)) throw new Error(`Agent email must be an address on ${domains.join(" or ")}`);
}

/** The signed-in user as an active agent. Checked on every agent call: active `agents` row linked to this
 * user, "agent" role present, account enabled and the email still on an allowed website domain. */
export async function assertAgent(userId: string): Promise<AgentRow> {
  const [row] = await db.select({ agent: agents, email: user.email, enabled: user.isActive })
    .from(agents)
    .innerJoin(user, eq(user.id, agents.user_id))
    .innerJoin(userRoles, and(eq(userRoles.userId, agents.user_id), eq(userRoles.role, "agent")))
    .where(and(eq(agents.user_id, userId), eq(agents.status, "active")))
    .limit(1);
  if (!row || !row.enabled || !agentEmailOk(row.email) || row.email.toLowerCase() !== row.agent.email) throw new Error("Agent access required");
  return row.agent;
}

/** Default commission percent (admin-editable); falls back to the built-in default if never saved. */
export async function defaultCommissionPercent() {
  const [s] = await db.select({ p: agent_settings.default_commission_percent }).from(agent_settings).where(eq(agent_settings.id, 1)).limit(1);
  return s ? Number(s.p) : DEFAULT_COMMISSION_PERCENT;
}

/** The rate that applies to this agent right now: their own, else the site default. */
export async function resolveRate(agent: Pick<AgentRow, "commission_percent">) {
  return agent.commission_percent != null ? Number(agent.commission_percent) : defaultCommissionPercent();
}

/** True when this booking was made by the (active) agent behind `userId`. */
export async function agentOwnsBooking(userId: string, bookingId: string) {
  const [row] = await db.select({ id: agent_commissions.id }).from(agent_commissions)
    .innerJoin(agents, eq(agents.id, agent_commissions.agent_id))
    .where(and(eq(agent_commissions.booking_id, bookingId), eq(agents.user_id, userId), eq(agents.status, "active")))
    .limit(1);
  return !!row;
}

/** Looks up the admin invite for an email (invited or active agents only). */
export async function findAgentInvite(email: string) {
  const [a] = await db.select().from(agents).where(and(eq(agents.email, email), inArray(agents.status, ["invited", "active"]))).limit(1);
  return a;
}

/** True when the account behind this email already holds a staff-tier role (staff cannot be agents). */
export async function emailBelongsToStaff(email: string) {
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  return u ? isStaff(u.id) : false;
}

/** Verifies the emailed code with better-auth, forwards its session cookies on this response and
 * returns the user id + new session token. A pre-existing unverified account for the email has its
 * passwords and sessions wiped by better-auth before it is marked verified. */
export async function otpSignIn(email: string, otp: string) {
  const { headers, response } = await auth.api.signInEmailOTP({ body: { email, otp }, headers: getRequest().headers, returnHeaders: true });
  setResponseHeader("set-cookie", headers.getSetCookie());
  if (!response.token) throw new Error("Sign-in failed");
  return { userId: response.user.id, token: response.token };
}

/** The single place the agent role is granted after a verified code sign-in. One transaction:
 * refuse staff, link the invite, add the role, then drop every other session and password so the
 * only way into an agent account is the mailbox code (kills any pre-registered squatter access). */
export async function grantAgentAccess(opts: { userId: string; email: string; keepSessionToken: string }) {
  return db.transaction(async (tx) => {
    const [staff] = await tx.select({ id: userRoles.id }).from(userRoles)
      .where(and(eq(userRoles.userId, opts.userId), inArray(userRoles.role, ["staff", "admin", "super_admin"]))).limit(1);
    if (staff) throw new Error("Staff accounts cannot be agents");
    const [a] = await tx.update(agents)
      .set({ user_id: opts.userId, status: "active", joined_at: sql`coalesce(${agents.joined_at}, now())`, updated_at: new Date() })
      .where(and(eq(agents.email, opts.email), inArray(agents.status, ["invited", "active"]), or(isNull(agents.user_id), eq(agents.user_id, opts.userId))))
      .returning({ id: agents.id, full_name: agents.full_name });
    if (!a) throw new Error("Not registered as an agent");
    await tx.insert(userRoles).values({ userId: opts.userId, role: "agent" }).onConflictDoNothing();
    // The admin-entered invite name is authoritative: a pre-registered (squatter) account carries attacker-chosen text.
    await tx.update(user).set({ name: a.full_name, updatedAt: new Date() }).where(eq(user.id, opts.userId));
    await tx.delete(sessionTable).where(and(eq(sessionTable.userId, opts.userId), ne(sessionTable.token, opts.keepSessionToken)));
    await tx.delete(accountTable).where(and(eq(accountTable.userId, opts.userId), eq(accountTable.providerId, "credential")));
    await tx.insert(audit_logs).values({ actor_id: opts.userId, action: "agent_signin", entity: "agents", entity_id: a.id });
    return a;
  });
}

/** `pending` -> `payable` once the booking is fully paid (amount_paid >= total_amount). Guarded and idempotent. */
export async function settleCommission(tx: Tx, bookingId: string) {
  await tx.update(agent_commissions).set({ status: "payable", earned_at: new Date(), updated_at: new Date() })
    .where(and(
      eq(agent_commissions.booking_id, bookingId),
      eq(agent_commissions.status, "pending"),
      sql`exists (select 1 from ${bookings} b where b.id = ${agent_commissions.booking_id} and b.amount_paid >= b.total_amount and b.status not in ('cancelled', 'refunded'))`,
    ));
}

/** Booking cancelled: pending/payable -> void; already paid out -> clawback (admin recovers it). Idempotent. */
export async function voidCommission(bookingId: string) {
  await db.update(agent_commissions)
    .set({ status: sql`case when ${agent_commissions.status} = 'paid' then 'clawback' else 'void' end`, updated_at: new Date() })
    .where(and(eq(agent_commissions.booking_id, bookingId), inArray(agent_commissions.status, ["pending", "payable", "paid"])));
}

/** Booking cancelled: agent-recorded payments still awaiting verification can never be applied. */
export async function rejectPendingPayments(bookingId: string) {
  await db.update(payments)
    .set({ status: "rejected", notes: sql`concat_ws(' | ', ${payments.notes}, 'Auto-rejected: booking cancelled')` })
    .where(and(eq(payments.booking_id, bookingId), eq(payments.status, "pending_verification")));
}

/** The one place money is applied to a booking (staff `recordPayment` and admin verification of an
 * agent-recorded payment both use it). Locks the booking row so concurrent payments cannot over-collect
 * or lose updates, then settles the agent commission. Call inside a transaction. */
export async function applyCapturedPayment(tx: Tx, bookingId: string, amount: number) {
  const [b] = await tx.select({ status: bookings.status, amount_paid: bookings.amount_paid, total_amount: bookings.total_amount })
    .from(bookings).where(eq(bookings.id, bookingId)).for("update");
  if (!b) throw new Error("Booking not found");
  if (b.status === "cancelled" || b.status === "refunded") throw new Error("Booking is cancelled");
  const total = Number(b.total_amount);
  const paid = Number(b.amount_paid) + amount;
  if (paid > total) throw new Error(`Amount exceeds balance due (₹${total - Number(b.amount_paid)})`);
  const status = b.status === "cancellation_requested" ? b.status : paid >= total ? "confirmed" : "partially_paid";
  await tx.update(bookings).set({ amount_paid: String(paid), status }).where(eq(bookings.id, bookingId));
  await settleCommission(tx, bookingId);
  return { paid, status };
}
