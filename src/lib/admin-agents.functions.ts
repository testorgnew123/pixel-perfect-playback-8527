import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isAdmin } from "@/lib/roles.server";
import { db } from "@/lib/db.server";
import { sendEmail } from "@/lib/email.server";
import { agent_commissions, agent_settings, agents, audit_logs, bookings, departures, payments, userRoles, yatras } from "../../drizzle/schema";
import { COMMISSION_STATUSES, normalizeEmail, parsePercent } from "@/lib/commission";
import { applyCapturedPayment, assertAgentEmail, defaultCommissionPercent, emailBelongsToStaff } from "@/lib/agent.server";

// Agent management is money-handling, so every function here is admin-only on the SERVER
// (not just hidden in the UI). Audit rows carry ids and payment amounts only, never rates or
// payout references: listAuditLog is readable by any staff.
async function assertAdmin(userId: string) {
  if (!(await isAdmin(userId))) throw new Error("Admins only");
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === "";

export const listAgents = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [list, agg, defaultPercent] = await Promise.all([
      db.select().from(agents).orderBy(desc(agents.created_at)),
      db.select({ agent_id: agent_commissions.agent_id, status: agent_commissions.status, n: count(), sum: sql<string>`coalesce(sum(${agent_commissions.amount}), 0)` })
        .from(agent_commissions).groupBy(agent_commissions.agent_id, agent_commissions.status),
      defaultCommissionPercent(),
    ]);
    return {
      defaultPercent,
      agents: list.map((a) => {
        const mine = agg.filter((x) => x.agent_id === a.id);
        const by = (s: string) => Number(mine.find((x) => x.status === s)?.sum ?? 0);
        return { ...a, bookings: mine.reduce((n, x) => n + x.n, 0), pending: by("pending"), payable: by("payable"), paid: by("paid"), clawback: by("clawback") };
      }),
    };
  });

export const inviteAgent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { email: string; full_name: string; phone?: string; commission_percent?: number | string | null }) => {
    const full_name = String(d?.full_name ?? "").trim().slice(0, 120);
    if (!full_name) throw new Error("Name is required");
    const phone = String(d?.phone ?? "").trim().slice(0, 20);
    if (phone && !/^[0-9+\s-]{10,15}$/.test(phone)) throw new Error("Invalid phone number");
    const commission_percent = blank(d?.commission_percent) ? null : parsePercent(d.commission_percent);
    if (commission_percent === undefined) throw new Error("Commission must be a number from 0 to 100");
    return { email: String(d?.email ?? ""), full_name, phone, commission_percent };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    assertAgentEmail(data.email); // website-domain rule, fail closed
    const email = normalizeEmail(data.email);
    if (await emailBelongsToStaff(email)) throw new Error("This email belongs to a staff account; staff cannot be agents");
    const [dup] = await db.select({ id: agents.id }).from(agents).where(eq(agents.email, email)).limit(1);
    if (dup) throw new Error("This email has already been invited");
    const [a] = await db.insert(agents).values({
      email, full_name: data.full_name, phone: data.phone || null, invited_by: context.userId,
      commission_percent: data.commission_percent === null ? null : String(data.commission_percent),
    }).returning({ id: agents.id });
    if (!a) throw new Error("Could not save the invite");
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "agent_invite", entity: "agents", entity_id: a.id });
    const loginUrl = `${(process.env["BETTER_AUTH_URL"] ?? "https://harishivshankartirthyatra.com").replace(/\/+$/, "")}/hi/agent/login`;
    let emailOk = true;
    try {
      await sendEmail({
        to: email,
        subject: "You are invited as an agent – Hari Shiv Shankar Tirth Yatra",
        html: `<p>Namaste ${esc(data.full_name)},</p><p>You have been invited as an agent of Hari Shiv Shankar Tirth Yatra.</p><p>Sign in with this email address (we send a one-time code to it): <a href="${loginUrl}">${loginUrl}</a></p>`,
      });
    } catch {
      emailOk = false;
    }
    return { id: a.id, loginUrl, emailOk };
  });

export const updateAgent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; full_name?: string; phone?: string; commission_percent?: number | string | null; status?: "active" | "suspended"; revoke?: boolean }) => {
    if (typeof d?.id !== "string") throw new Error("Invalid agent");
    const out: { id: string; full_name?: string; phone?: string; commission_percent?: number | null; status?: "active" | "suspended"; revoke?: boolean } = { id: d.id };
    if (d.full_name !== undefined) { out.full_name = String(d.full_name).trim().slice(0, 120); if (!out.full_name) throw new Error("Name is required"); }
    if (d.phone !== undefined) { out.phone = String(d.phone).trim().slice(0, 20); if (out.phone && !/^[0-9+\s-]{10,15}$/.test(out.phone)) throw new Error("Invalid phone number"); }
    if ("commission_percent" in d) {
      const p = blank(d.commission_percent) ? null : parsePercent(d.commission_percent);
      if (p === undefined) throw new Error("Commission must be a number from 0 to 100");
      out.commission_percent = p;
    }
    if (d.status !== undefined) { if (d.status !== "active" && d.status !== "suspended") throw new Error("Invalid status"); out.status = d.status; }
    if (d.revoke) out.revoke = true;
    return out;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const [a] = await db.select().from(agents).where(eq(agents.id, data.id)).limit(1);
    if (!a) throw new Error("Agent not found");
    if (data.revoke) {
      if (a.user_id) throw new Error("This agent has already signed in; suspend them instead");
      await db.delete(agents).where(and(eq(agents.id, a.id), isNull(agents.user_id)));
      await db.insert(audit_logs).values({ actor_id: context.userId, action: "agent_invite_revoked", entity: "agents", entity_id: a.id });
      return { ok: true as const };
    }
    if (data.status === "active" && a.user_id) {
      assertAgentEmail(a.email); // re-check before restoring access
      if (await emailBelongsToStaff(a.email)) throw new Error("This email belongs to a staff account; staff cannot be agents");
    }
    await db.transaction(async (tx) => {
      const set: Partial<typeof agents.$inferInsert> = { updated_at: new Date() };
      if (data.full_name !== undefined) set.full_name = data.full_name;
      if (data.phone !== undefined) set.phone = data.phone || null;
      if (data.commission_percent !== undefined) set.commission_percent = data.commission_percent === null ? null : String(data.commission_percent);
      if (data.status === "suspended") {
        set.status = "suspended";
        // Dropping the role makes every live session lose agent access at once.
        if (a.user_id) await tx.delete(userRoles).where(and(eq(userRoles.userId, a.user_id), eq(userRoles.role, "agent")));
      } else if (data.status === "active") {
        // Never signed in yet -> back to "invited"; otherwise restore the role they already earned by code sign-in.
        set.status = a.user_id ? "active" : "invited";
        if (a.user_id) await tx.insert(userRoles).values({ userId: a.user_id, role: "agent" }).onConflictDoNothing();
      }
      await tx.update(agents).set(set).where(eq(agents.id, a.id));
      await tx.insert(audit_logs).values({ actor_id: context.userId, action: "agent_update", entity: "agents", entity_id: a.id, details: { status: data.status ?? null } });
    });
    return { ok: true as const };
  });

export const saveAgentDefaults = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { percent: number | string }) => {
    const percent = parsePercent(d?.percent);
    if (percent === undefined) throw new Error("Commission must be a number from 0 to 100");
    return { percent };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await db.insert(agent_settings).values({ id: 1, default_commission_percent: String(data.percent) })
      .onConflictDoUpdate({ target: agent_settings.id, set: { default_commission_percent: String(data.percent), updated_at: new Date() } });
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "agent_defaults_update", entity: "agent_settings", entity_id: "1" });
    return { ok: true as const };
  });

export const listCommissions = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { status?: string; agentId?: string } | undefined) => {
    const status = d?.status || undefined;
    if (status && !(COMMISSION_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status");
    return { status, agentId: d?.agentId || undefined };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return db.select({
      id: agent_commissions.id, status: agent_commissions.status, amount: agent_commissions.amount, rate_percent: agent_commissions.rate_percent,
      basis_amount: agent_commissions.basis_amount, earned_at: agent_commissions.earned_at, paid_at: agent_commissions.paid_at, payout_reference: agent_commissions.payout_reference,
      agent_id: agents.id, agent_name: agents.full_name, agent_email: agents.email,
      booking_id: bookings.id, booking_code: bookings.booking_code, booking_status: bookings.status, total: bookings.total_amount, paid: bookings.amount_paid,
      start_date: departures.start_date, yatra: yatras.title_en,
    }).from(agent_commissions)
      .innerJoin(agents, eq(agents.id, agent_commissions.agent_id))
      .innerJoin(bookings, eq(bookings.id, agent_commissions.booking_id))
      .leftJoin(departures, eq(departures.id, bookings.departure_id))
      .leftJoin(yatras, eq(yatras.id, bookings.yatra_id))
      .where(and(data.status ? eq(agent_commissions.status, data.status) : undefined, data.agentId ? eq(agent_commissions.agent_id, data.agentId) : undefined))
      .orderBy(desc(agent_commissions.created_at)).limit(1000);
  });

/** payable -> paid (reference required, never for a cancelled booking) or clawback -> void (note required).
 * All-or-nothing: if any selected row has changed state meanwhile, nothing is updated. */
export const setCommissionStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { ids: string[]; to: "paid" | "void"; reference: string }) => {
    if (!Array.isArray(d?.ids) || d.ids.some((x) => typeof x !== "string")) throw new Error("Select at least one commission");
    const ids = [...new Set(d.ids)];
    if (!ids.length || ids.length > 200) throw new Error("Select between 1 and 200 commissions");
    if (d.to !== "paid" && d.to !== "void") throw new Error("Invalid action");
    const reference = String(d.reference ?? "").trim().slice(0, 200);
    if (reference.length < 3) throw new Error(d.to === "paid" ? "A payout reference is required" : "A note is required");
    return { ids, to: d.to, reference };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await db.transaction(async (tx) => {
      const rows = data.to === "paid"
        ? await tx.update(agent_commissions)
            .set({ status: "paid", paid_at: new Date(), paid_by: context.userId, payout_reference: data.reference, updated_at: new Date() })
            .where(and(
              inArray(agent_commissions.id, data.ids),
              eq(agent_commissions.status, "payable"),
              sql`not exists (select 1 from ${bookings} b where b.id = ${agent_commissions.booking_id} and b.status in ('cancelled', 'refunded'))`,
            )).returning({ id: agent_commissions.id })
        : await tx.update(agent_commissions)
            .set({ status: "void", payout_reference: sql`concat_ws(' | ', ${agent_commissions.payout_reference}, ${data.reference}::text)`, updated_at: new Date() })
            .where(and(inArray(agent_commissions.id, data.ids), eq(agent_commissions.status, "clawback")))
            .returning({ id: agent_commissions.id });
      if (rows.length !== data.ids.length) throw new Error(`${data.ids.length - rows.length} selected commission(s) can no longer be updated. Refresh and try again.`);
      await tx.insert(audit_logs).values({ actor_id: context.userId, action: data.to === "paid" ? "commission_paid" : "commission_clawback_resolved", entity: "agent_commissions", details: { ids: data.ids } });
    });
    return { updated: data.ids.length };
  });

export const listPendingAgentPayments = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return db.select({
      id: payments.id, amount: payments.amount, method: payments.method, reference: payments.notes, created_at: payments.created_at,
      booking_id: bookings.id, booking_code: bookings.booking_code, booking_status: bookings.status, total: bookings.total_amount, paid: bookings.amount_paid,
      agent_name: agents.full_name, agent_email: agents.email,
    }).from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.booking_id))
      .leftJoin(agent_commissions, eq(agent_commissions.booking_id, bookings.id))
      .leftJoin(agents, eq(agents.id, agent_commissions.agent_id))
      .where(eq(payments.status, "pending_verification"))
      .orderBy(payments.created_at).limit(500);
  });

/** Admin decision on an agent-recorded payment. Approving applies it through the same guarded helper
 * as staff payments (locks the booking, refuses over-collection, settles commission); any guard
 * failure rolls everything back and the payment stays pending so it can be rejected instead. */
export const verifyAgentPayment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { paymentId: string; approve: boolean; note?: string }) => {
    if (typeof d?.paymentId !== "string") throw new Error("Invalid payment");
    return { paymentId: d.paymentId, approve: !!d.approve, note: String(d.note ?? "").trim().slice(0, 200) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await db.transaction(async (tx) => {
      const [p] = await tx.select().from(payments)
        .where(and(eq(payments.id, data.paymentId), eq(payments.status, "pending_verification"))).for("update");
      if (!p) throw new Error("This payment is no longer pending");
      if (data.approve) {
        await applyCapturedPayment(tx, p.booking_id, Number(p.amount));
        await tx.update(payments).set({ status: "captured" }).where(eq(payments.id, p.id));
      } else {
        await tx.update(payments).set({ status: "rejected", notes: sql`concat_ws(' | ', ${payments.notes}, ${data.note ? `Rejected: ${data.note}` : "Rejected"}::text)` }).where(eq(payments.id, p.id));
      }
      await tx.insert(audit_logs).values({
        actor_id: context.userId, action: data.approve ? "agent_payment_verified" : "agent_payment_rejected", entity: "payments", entity_id: p.id,
        details: { bookingId: p.booking_id, amount: Number(p.amount) },
      });
    });
    return { ok: true as const };
  });
