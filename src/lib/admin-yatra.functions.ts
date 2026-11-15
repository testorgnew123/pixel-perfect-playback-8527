import { createServerFn } from "@tanstack/react-start";
import { count, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isAdmin, isStaff } from "@/lib/roles.server";
import { db } from "@/lib/db.server";
import {
  yatras, yatra_pricing, yatra_categories, yatra_destinations,
  yatra_images, yatra_itinerary_days, yatra_addons, yatra_pickup_cities, yatra_list_items, yatra_faqs,
  yatra_versions, audit_logs, bookings,
} from "../../drizzle/schema";

type Row = Record<string, unknown>;

const CHILD_TABLES = {
  images: yatra_images,
  days: yatra_itinerary_days,
  addons: yatra_addons,
  pickups: yatra_pickup_cities,
  items: yatra_list_items,
  faqs: yatra_faqs,
} as const;

async function assertStaffCtx(userId: string) {
  if (!(await isStaff(userId))) throw new Error("Staff only");
}

export const loadYatraAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const y = await db.query.yatras.findFirst({ where: eq(yatras.id, data.id) });
    if (!y) throw new Error("Yatra not found");
    const [pricing, cats, dests, images, days, addons, pickups, items, faqs] = await Promise.all([
      db.query.yatra_pricing.findFirst({ where: eq(yatra_pricing.yatra_id, data.id) }),
      db.query.yatra_categories.findMany({ where: eq(yatra_categories.yatra_id, data.id), columns: { category_id: true } }),
      db.query.yatra_destinations.findMany({ where: eq(yatra_destinations.yatra_id, data.id), columns: { destination_id: true } }),
      db.query.yatra_images.findMany({ where: eq(yatra_images.yatra_id, data.id), orderBy: (t, { asc }) => asc(t.sort_order) }),
      db.query.yatra_itinerary_days.findMany({ where: eq(yatra_itinerary_days.yatra_id, data.id), orderBy: (t, { asc }) => asc(t.day_number) }),
      db.query.yatra_addons.findMany({ where: eq(yatra_addons.yatra_id, data.id), orderBy: (t, { asc }) => asc(t.sort_order) }),
      db.query.yatra_pickup_cities.findMany({ where: eq(yatra_pickup_cities.yatra_id, data.id), orderBy: (t, { asc }) => asc(t.sort_order) }),
      db.query.yatra_list_items.findMany({ where: eq(yatra_list_items.yatra_id, data.id), orderBy: (t, { asc }) => asc(t.sort_order) }),
      db.query.yatra_faqs.findMany({ where: eq(yatra_faqs.yatra_id, data.id), orderBy: (t, { asc }) => asc(t.sort_order) }),
    ]);
    return {
      y, pricing: pricing ?? {},
      cats: cats.map((x) => x.category_id), dests: dests.map((x) => x.destination_id),
      images, days, addons, pickups, items, faqs,
    };
  });

/** Saves the whole yatra (replacing child rows) in one transaction, records a
 * version snapshot and an audit entry. Returns the yatra id. */
export const saveYatraAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: {
    state: { y: Row; pricing: Row; cats: string[]; dests: string[]; images: Row[]; days: Row[]; addons: Row[]; pickups: Row[]; items: Row[]; faqs: Row[] };
    action?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const { id, created_at, updated_at, ...y } = data.state.y;
    const title_en = String(y["title_en"] ?? "").trim();
    const slug = String(y["slug"] ?? "");
    if (!title_en) throw new Error("English title is required");
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Slug must use lowercase letters, numbers and dashes");

    return db.transaction(async (tx) => {
      const [row] = id
        ? await tx.update(yatras).set(y as never).where(eq(yatras.id, id as string)).returning({ id: yatras.id })
        : await tx.insert(yatras).values(y as never).returning({ id: yatras.id });
      if (!row) throw new Error("Could not save yatra");
      const yid = row.id;

      const { yatra_id: _p, ...pricing } = data.state.pricing;
      await tx.insert(yatra_pricing).values({ ...pricing, yatra_id: yid } as never).onConflictDoUpdate({ target: yatra_pricing.yatra_id, set: pricing as never });

      for (const [key, table] of Object.entries(CHILD_TABLES)) {
        await tx.delete(table).where(eq(table.yatra_id, yid));
        const rows = (data.state[key as keyof typeof CHILD_TABLES] as Row[]).map((r, i) => {
          const { id: _id, yatra_id: _y, created_at: _c, ...rest } = r;
          return { ...rest, yatra_id: yid, ...(key === "days" ? { day_number: i + 1 } : { sort_order: i }) };
        });
        if (rows.length) await tx.insert(table).values(rows as never);
      }

      await tx.delete(yatra_categories).where(eq(yatra_categories.yatra_id, yid));
      if (data.state.cats.length) await tx.insert(yatra_categories).values(data.state.cats.map((c) => ({ yatra_id: yid, category_id: c })));

      await tx.delete(yatra_destinations).where(eq(yatra_destinations.yatra_id, yid));
      if (data.state.dests.length) await tx.insert(yatra_destinations).values(data.state.dests.map((c) => ({ yatra_id: yid, destination_id: c })));

      await tx.insert(yatra_versions).values({ yatra_id: yid, snapshot: { ...data.state, y: { ...data.state.y, id: yid } } as never, created_by: context.userId });
      await tx.insert(audit_logs).values({ actor_id: context.userId, action: id ? (data.action ?? "update") : "create", entity: "yatras", entity_id: yid, details: { title: title_en, status: y["status"] } as never });

      return yid;
    });
  });

/** Disable (archive: hidden from the public site) or re-enable (publish) a yatra. */
export const setYatraEnabledAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; enabled: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const status = data.enabled ? "published" : "archived";
    const [row] = await db.update(yatras).set({ status }).where(eq(yatras.id, data.id)).returning({ id: yatras.id, title_en: yatras.title_en });
    if (!row) throw new Error("Yatra not found");
    await db.insert(audit_logs).values({ actor_id: context.userId, action: data.enabled ? "enable" : "disable", entity: "yatras", entity_id: row.id, details: { title: row.title_en, status } as never });
    return { ok: true };
  });

/** Permanently deletes a yatra and its child rows/departures (DB cascade). Admin only.
 * Refused while bookings reference it — disable it instead. */
export const deleteYatraAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const [{ value: nBookings } = { value: 0 }] = await db.select({ value: count() }).from(bookings).where(eq(bookings.yatra_id, data.id));
    if (nBookings > 0) throw new Error(`Cannot delete: ${nBookings} booking(s) exist for this yatra. Disable it instead.`);
    const [row] = await db.delete(yatras).where(eq(yatras.id, data.id)).returning({ id: yatras.id, title_en: yatras.title_en });
    if (!row) throw new Error("Yatra not found");
    await db.insert(audit_logs).values({ actor_id: context.userId, action: "delete", entity: "yatras", entity_id: row.id, details: { title: row.title_en } as never });
    return { ok: true };
  });
