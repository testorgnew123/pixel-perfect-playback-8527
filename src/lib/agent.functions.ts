import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { db } from "@/lib/db.server";
import { agent_commissions, audit_logs, bookings, departures, payments, yatras } from "../../drizzle/schema";
import { AGENT_PAYMENT_METHODS, normalizeEmail } from "@/lib/commission";
import { agentDomains, agentEmailOk, agentOwnsBooking, assertAgent, emailBelongsToStaff, findAgentInvite, grantAgentAccess, otpSignIn, resolveRate } from "@/lib/agent.server";

/** Public. The website email domain(s) agents must use. Not a secret; lets the login form refuse a wrong
 * address before a code is sent. The real enforcement stays in inviteAgent / agentSignIn / assertAgent. */
export const getAgentEmailDomains = createServerFn({ method: "GET" }).handler(async () => agentDomains());

/** Agent login. This is the ONLY way the agent role is granted: the emailed code is verified here, so
 * proof of mailbox control and the grant happen in one server call (no claim step to race). The
 * website-domain rule and the admin invite are checked BEFORE the code is touched, so an ineligible
 * email never consumes a code or creates an account through this door. */
export const agentSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; otp: string }) => {
    const otp = String(d?.otp ?? "").trim();
    if (!/^\d{4,10}$/.test(otp)) throw new Error("Enter the code from your email");
    return { email: String(d?.email ?? ""), otp };
  })
  .handler(async ({ data }) => {
    const refuse = () => new Error("This email is not registered for agent access");
    if (!agentEmailOk(data.email)) throw refuse();
    const email = normalizeEmail(data.email);
    if (!(await findAgentInvite(email)) || (await emailBelongsToStaff(email))) throw refuse();
    const { userId, token } = await otpSignIn(email, data.otp);
    await grantAgentAccess({ userId, email, keepSessionToken: token });
    return { ok: true as const };
  });

/** The signed-in agent's own profile (name, status and the commission rate that applies to them). */
export const getAgentMe = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const a = await assertAgent(context.userId);
    return { name: a.full_name, email: a.email, rate: await resolveRate(a) };
  });

/** The agent's own bookings with their commission, explicit columns only. Totals exclude void/clawback. */
export const listMyAgentBookings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const a = await assertAgent(context.userId);
    const rows = await db.select({
      id: bookings.id, code: bookings.booking_code, status: bookings.status, adults: bookings.adults, children: bookings.children, infants: bookings.infants,
      total: bookings.total_amount, paid: bookings.amount_paid, created_at: bookings.created_at, contact: bookings.contact,
      yatra_en: yatras.title_en, yatra_hi: yatras.title_hi, start_date: departures.start_date,
      c_amount: agent_commissions.amount, c_status: agent_commissions.status, c_rate: agent_commissions.rate_percent,
      awaiting: sql<string>`coalesce((select sum(p.amount) from ${payments} p where p.booking_id = ${bookings.id} and p.status = 'pending_verification'), 0)`,
    }).from(agent_commissions)
      .innerJoin(bookings, eq(bookings.id, agent_commissions.booking_id))
      .leftJoin(yatras, eq(yatras.id, bookings.yatra_id))
      .leftJoin(departures, eq(departures.id, bookings.departure_id))
      .where(eq(agent_commissions.agent_id, a.id))
      .orderBy(desc(bookings.created_at)).limit(500);
    const list = rows.map(({ contact, ...r }) => {
      const c = (contact ?? {}) as { name?: string; mobile?: string };
      return { ...r, customer: c.name ?? "", mobile: c.mobile ?? "" };
    });
    const sum = (s: string) => list.filter((r) => r.c_status === s).reduce((n, r) => n + Number(r.c_amount), 0);
    return { bookings: list, totals: { pending: sum("pending"), payable: sum("payable"), paid: sum("paid") } };
  });

/** An agent logs a payment they collected. It does NOT count (amount_paid and status are untouched, so
 * no commission can become payable) until an admin verifies it. */
export const agentRecordPayment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { bookingId: string; amount: number; method: string; reference: string }) => {
    const amount = Math.round(Number(d?.amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) throw new Error("Invalid amount");
    if (typeof d?.bookingId !== "string" || !(AGENT_PAYMENT_METHODS as readonly string[]).includes(d.method)) throw new Error("Invalid payment details");
    const reference = String(d.reference ?? "").trim().slice(0, 200);
    if (reference.length < 3) throw new Error("A reference / receipt number is required");
    return { bookingId: d.bookingId, amount, method: d.method, reference };
  })
  .handler(async ({ data, context }) => {
    await assertAgent(context.userId);
    if (!(await agentOwnsBooking(context.userId, data.bookingId))) throw new Error("Not your booking");
    await db.transaction(async (tx) => {
      const [b] = await tx.select({ status: bookings.status, amount_paid: bookings.amount_paid, total_amount: bookings.total_amount })
        .from(bookings).where(eq(bookings.id, data.bookingId)).for("update");
      if (!b) throw new Error("Booking not found");
      if (b.status !== "pending_payment" && b.status !== "partially_paid") throw new Error("This booking is not awaiting payment");
      const [p] = await tx.select({ n: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments)
        .where(and(eq(payments.booking_id, data.bookingId), eq(payments.status, "pending_verification")));
      const due = Number(b.total_amount) - Number(b.amount_paid) - Number(p?.n ?? 0);
      if (data.amount > due) throw new Error(`Amount exceeds balance due (₹${Math.max(0, due)})`);
      await tx.insert(payments).values({ booking_id: data.bookingId, amount: String(data.amount), method: data.method, status: "pending_verification", recorded_by: context.userId, notes: data.reference });
      await tx.insert(audit_logs).values({ actor_id: context.userId, action: "agent_payment_recorded", entity: "bookings", entity_id: data.bookingId, details: { amount: data.amount, method: data.method } });
    });
    return { ok: true as const };
  });
