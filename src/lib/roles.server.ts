import { eq } from "drizzle-orm";
import { db } from "./db.server";
import { userRoles } from "../../drizzle/schema";

// "agent" is deliberately in neither list below: agents never get staff or admin access.
export type AppRole = "customer" | "staff" | "admin" | "super_admin" | "agent";
const STAFF_ROLES: AppRole[] = ["staff", "admin", "super_admin"];
const ADMIN_ROLES: AppRole[] = ["admin", "super_admin"];

export async function getRoles(userId: string): Promise<AppRole[]> {
  const rows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
  return rows.map((r) => r.role as AppRole);
}

export async function hasRole(userId: string, role: AppRole) {
  return (await getRoles(userId)).includes(role);
}

export async function isStaff(userId: string) {
  const roles = await getRoles(userId);
  return roles.some((r) => STAFF_ROLES.includes(r));
}

export async function isAdmin(userId: string) {
  const roles = await getRoles(userId);
  return roles.some((r) => ADMIN_ROLES.includes(r));
}
