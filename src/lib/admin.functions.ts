import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware.server";
import { auth } from "@/lib/auth.server";
import { db } from "@/lib/db.server";
import { user, userRoles, session as sessionTable } from "../../drizzle/schema";
import { hasRole } from "@/lib/roles.server";

type Role = "staff" | "admin" | "super_admin";

async function assertSuper(ctx: { userId: string }) {
  if (!(await hasRole(ctx.userId, "super_admin"))) throw new Error("Only the super admin can manage admin users");
}

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertSuper(context);
    const roles = await db.select({ userId: userRoles.userId, role: userRoles.role }).from(userRoles).where(inArray(userRoles.role, ["staff", "admin", "super_admin"]));
    const ids = [...new Set(roles.map((r) => r.userId))];
    if (!ids.length) return [];
    const users = await db.select({ id: user.id, full_name: user.name, email: user.email, phone: user.phone, is_active: user.isActive, must_change_password: user.mustChangePassword }).from(user).where(inArray(user.id, ids));
    return users.map((u) => ({ ...u, roles: roles.filter((r) => r.userId === u.id).map((r) => r.role) }));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { email: string; full_name: string; password: string; role: Role }) => {
    if (!/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Invalid email");
    if (!d.password || d.password.length < 8) throw new Error("Password must be at least 8 characters");
    if (!["staff", "admin", "super_admin"].includes(d.role)) throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const email = data.email.trim().toLowerCase();
    const { user: created } = await auth.api.signUpEmail({ body: { email, password: data.password, name: data.full_name, mustChangePassword: true } });
    await db.update(user).set({ mustChangePassword: true }).where(eq(user.id, created.id));
    await db.insert(userRoles).values({ userId: created.id, role: data.role });
    return { id: created.id };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { userId: string; role?: Role; is_active?: boolean; remove?: boolean }) => {
    // Runtime check, not just the type: this must never be able to write "agent" (or any other role)
    // around the agent invite rule.
    if (d.role !== undefined && !["staff", "admin", "super_admin"].includes(d.role)) throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    if (data.userId === context.userId) throw new Error("You cannot change your own access");
    if (data.role || data.remove) {
      await db.delete(userRoles).where(and(eq(userRoles.userId, data.userId), inArray(userRoles.role, ["staff", "admin", "super_admin"])));
      if (data.role && !data.remove) await db.insert(userRoles).values({ userId: data.userId, role: data.role });
    }
    if (typeof data.is_active === "boolean") {
      await db.update(user).set({ isActive: data.is_active }).where(eq(user.id, data.userId));
      // Kill any session already open, not just future sign-ins.
      if (!data.is_active) await db.delete(sessionTable).where(eq(sessionTable.userId, data.userId));
    }
    return { ok: true };
  });
