import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, gt, gte, inArray, lt } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isStaff } from "@/lib/roles.server";
import { db } from "@/lib/db.server";
import {
  site_settings, user, userRoles, enquiries, yatras, departures, bookings, waitlist,
  categories, destinations, yatra_versions, audit_logs,
} from "../../drizzle/schema";

async function assertStaffCtx(userId: string) {
  if (!(await isStaff(userId))) throw new Error("Staff only");
}

/** Self-service audit entries (e.g. a user changing their own password) —
 * no staff check, just records who did what. */
export const logSelfAudit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { action: string; entity: string; entityId?: string }) => d)
  .handler(async ({ data, context }) => {
    await db.insert(audit_logs).values({ actor_id: context.userId, action: data.action, entity: data.entity, entity_id: data.entityId ?? context.userId });
    return { ok: true };
  });

// ---------- settings ----------
export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    return db.query.site_settings.findFirst({ where: eq(site_settings.id, 1) });
  });

export const saveAdminSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const { id, updated_at, ...payload } = data;
    await db.update(site_settings).set(payload).where(eq(site_settings.id, 1));
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "update", entity: "site_settings", entity_id: "1" });
    return { ok: true };
  });

// ---------- leads ----------
export const getStaffList = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    const roles = await db.query.userRoles.findMany({ where: inArray(userRoles.role, ["staff", "admin", "super_admin"]), columns: { userId: true } });
    const ids = [...new Set(roles.map((r) => r.userId))];
    if (!ids.length) return [];
    const rows = await db.query.user.findMany({ where: inArray(user.id, ids), columns: { id: true, name: true, email: true } });
    return rows.map((u) => ({ id: u.id, full_name: u.name, email: u.email }));
  });

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { status?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    return db.query.enquiries.findMany({
      where: data.status ? eq(enquiries.status, data.status as never) : undefined,
      orderBy: desc(enquiries.created_at),
      limit: 1000,
    });
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    await db.update(enquiries).set(data.patch).where(eq(enquiries.id, data.id));
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "update", entity: "enquiries", entity_id: data.id, details: data.patch as never });
    return { ok: true };
  });

// ---------- dashboard ----------
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    const today = new Date().toISOString().slice(0, 10);
    const c = async (rows: { value: number }[]) => rows[0]?.value ?? 0;
    const [publishedC, draftsC, depsC, leadsC, bookingsC, recent, upcoming] = await Promise.all([
      db.select({ value: count() }).from(yatras).where(eq(yatras.status, "published")).then(c),
      db.select({ value: count() }).from(yatras).where(eq(yatras.status, "draft")).then(c),
      db.select({ value: count() }).from(departures).where(gte(departures.start_date, today)).then(c),
      db.select({ value: count() }).from(enquiries).where(eq(enquiries.status, "new")).then(c),
      db.select({ value: count() }).from(bookings).then(c),
      db.query.enquiries.findMany({ columns: { id: true, name: true, mobile: true, yatra_interest: true, created_at: true, status: true }, orderBy: desc(enquiries.created_at), limit: 6 }),
      db.query.departures.findMany({ where: gte(departures.start_date, today), orderBy: asc(departures.start_date), limit: 6, with: { yatra: { columns: { title_en: true } } } }),
    ]);
    return { yatras: publishedC, drafts: draftsC, deps: depsC, leads: leadsC, bookings: bookingsC, recent, upcoming };
  });

// ---------- audit log ----------
export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    const logs = await db.query.audit_logs.findMany({ orderBy: desc(audit_logs.created_at), limit: 300 });
    const ids = [...new Set(logs.map((l) => l.actor_id).filter((id): id is string => !!id))];
    const users = ids.length ? await db.query.user.findMany({ where: inArray(user.id, ids), columns: { id: true, email: true } }) : [];
    const m = new Map(users.map((u) => [u.id, u.email]));
    return logs.map((l) => ({ ...l, who: m.get(l.actor_id ?? "") ?? "—" }));
  });

// ---------- yatra lookups (editor + departures manager) ----------
export const getYatraLookups = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    const [cats, dests] = await Promise.all([
      db.query.categories.findMany({ orderBy: asc(categories.sort_order), columns: { id: true, name_en: true } }),
      db.query.destinations.findMany({ orderBy: asc(destinations.name_en), columns: { id: true, name_en: true } }),
    ]);
    return { cats, dests };
  });

export const listYatraNames = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    return db.query.yatras.findMany({ orderBy: asc(yatras.title_en), columns: { id: true, title_en: true, duration_days: true } });
  });

export const listYatrasAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    return db.query.yatras.findMany({
      orderBy: desc(yatras.updated_at),
      columns: { id: true, slug: true, title_en: true, title_hi: true, status: true, price: true, duration_days: true, featured: true, cover_image: true, updated_at: true },
    });
  });

export const listYatraVersions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { yatraId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const versions = await db.query.yatra_versions.findMany({ where: eq(yatra_versions.yatra_id, data.yatraId), orderBy: desc(yatra_versions.created_at), limit: 10 });
    const ids = [...new Set(versions.map((v) => v.created_by).filter((id): id is string => !!id))];
    const users = ids.length ? await db.query.user.findMany({ where: inArray(user.id, ids), columns: { id: true, email: true } }) : [];
    const m = new Map(users.map((u) => [u.id, u.email]));
    return versions.map((v) => ({ ...v, who: m.get(v.created_by ?? "") ?? "" }));
  });

// ---------- departures (admin) ----------
export const listDeparturesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { yatraId?: string; past?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const today = new Date().toISOString().slice(0, 10);
    return db.query.departures.findMany({
      where: and(data.past ? lt(departures.start_date, today) : gte(departures.start_date, today), data.yatraId ? eq(departures.yatra_id, data.yatraId) : undefined),
      orderBy: data.past ? desc(departures.start_date) : asc(departures.start_date),
      limit: 500,
      with: { yatra: { columns: { title_en: true } } },
    });
  });

/** Departures still open for a manual booking (strictly after today, seats available). */
export const listOpenDepartures = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    const today = new Date().toISOString().slice(0, 10);
    return db.query.departures.findMany({
      where: and(gt(departures.start_date, today), inArray(departures.status, ["available", "filling_fast"])),
      orderBy: asc(departures.start_date),
      with: { yatra: { columns: { title_en: true } } },
    });
  });

export const saveDeparture = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id?: string; yatra_id: string; start_date: string; end_date: string; total_seats: number; price_override: number | null; status: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const { id, ...payload } = data;
    const [row] = id
      ? await db.update(departures).set(payload as never).where(eq(departures.id, id)).returning({ id: departures.id })
      : await db.insert(departures).values(payload as never).returning({ id: departures.id });
    if (!row) throw new Error("Could not save departure");
    await db.insert(audit_logs).values({ actor_id: context.userId, action: id ? "update" : "create", entity: "departures", entity_id: row.id, details: payload as never });
    return { id: row.id };
  });

export const deleteDeparture = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const dep = await db.query.departures.findFirst({ where: eq(departures.id, data.id), columns: { booked_seats: true } });
    if (dep && dep.booked_seats > 0) throw new Error("This departure has bookings — close it instead");
    await db.delete(departures).where(eq(departures.id, data.id));
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "delete", entity: "departures", entity_id: data.id });
    return { ok: true };
  });

// ---------- bookings list + waitlist (admin) ----------
export const listBookingsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { status?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    return db.query.bookings.findMany({
      where: data.status ? eq(bookings.status, data.status as never) : undefined,
      orderBy: desc(bookings.created_at),
      limit: 500,
      columns: { id: true, booking_code: true, status: true, contact: true, adults: true, children: true, infants: true, total_amount: true, amount_paid: true, created_at: true },
      with: { yatras: { columns: { title_en: true } }, departures: { columns: { start_date: true } } },
    });
  });

export const listWaitlistAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertStaffCtx(context.userId);
    return db.query.waitlist.findMany({
      where: inArray(waitlist.status, ["waiting", "offered"]),
      orderBy: asc(waitlist.created_at),
      with: { departure: { columns: { start_date: true, total_seats: true, booked_seats: true }, with: { yatra: { columns: { title_en: true } } } } },
    });
  });

export const closeWaitlistEntry = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    await db.update(waitlist).set({ status: "closed" }).where(eq(waitlist.id, data.id));
    return { ok: true };
  });
