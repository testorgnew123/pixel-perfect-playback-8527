import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq, type AnyColumn } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/auth-middleware.server";
import { isStaff } from "@/lib/roles.server";
import { db } from "@/lib/db.server";
import * as schema from "../../drizzle/schema";

// Generic staff-gated CRUD for the admin content editor (CrudPage.tsx), one
// level above a raw table — table names are allow-listed (never interpolated
// into SQL) and every row still passes through assertStaffCtx, the same
// check used everywhere else staff access is required.
const TABLES = {
  categories: schema.categories,
  destinations: schema.destinations,
  blog_posts: schema.blog_posts,
  testimonials: schema.testimonials,
  gallery_images: schema.gallery_images,
  faqs: schema.faqs,
  team_members: schema.team_members,
  representatives: schema.representatives,
  banners: schema.banners,
  coupons: schema.coupons,
  reviews: schema.reviews,
} satisfies Record<string, PgTable>;
type TableName = keyof typeof TABLES;

function tableOf(name: string): PgTable & Record<string, AnyColumn> {
  if (!(name in TABLES)) throw new Error(`Unknown table: ${name}`);
  return TABLES[name as TableName] as never;
}

async function assertStaffCtx(userId: string) {
  if (!(await isStaff(userId))) throw new Error("Staff only");
}

export const adminListTable = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { table: string; orderBy?: string; ascending?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const table = tableOf(data.table);
    const orderCol = (data.orderBy && table[data.orderBy]) || table["sort_order"] || table["created_at"];
    const dir = data.ascending === false ? desc : asc;
    return db.select().from(table as never).orderBy(dir(orderCol)).limit(1000);
  });

export const adminSaveTable = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { table: string; id?: string; payload: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const table = tableOf(data.table);
    const [row] = data.id
      ? await db.update(table as never).set(data.payload).where(eq(table["id"], data.id)).returning({ id: table["id"] })
      : await db.insert(table as never).values(data.payload).returning({ id: table["id"] });
    if (!row) throw new Error("Could not save row");
    await db.insert(schema.audit_logs).values({ actor_id: context.userId, action: data.id ? "update" : "create", entity: data.table, entity_id: String(row.id), details: data.payload as never });
    return { id: row.id as string };
  });

export const adminDeleteTable = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { table: string; id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertStaffCtx(context.userId);
    const table = tableOf(data.table);
    await db.delete(table as never).where(eq(table["id"], data.id));
    await db.insert(schema.audit_logs).values({ actor_id: context.userId, action: "delete", entity: data.table, entity_id: data.id });
    return { ok: true };
  });
