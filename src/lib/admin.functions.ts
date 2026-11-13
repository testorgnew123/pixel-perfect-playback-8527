import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "staff" | "admin" | "super_admin";

async function assertSuper(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
  if (!data) throw new Error("Only the super admin can manage admin users");
}

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("role", ["staff", "admin", "super_admin"]);
    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    if (!ids.length) return [];
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name, email, phone, is_active, must_change_password").in("id", ids);
    return (profs ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string) }));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; full_name: string; password: string; role: Role }) => {
    if (!/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Invalid email");
    if (!d.password || d.password.length < 8) throw new Error("Password must be at least 8 characters");
    if (!["staff", "admin", "super_admin"].includes(d.role)) throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({ email: data.email.trim().toLowerCase(), password: data.password, email_confirm: true, user_metadata: { full_name: data.full_name } });
    if (error || !u.user) throw new Error(error?.message ?? "Could not create user");
    await supabaseAdmin.from("profiles").upsert({ id: u.user.id, email: data.email.trim().toLowerCase(), full_name: data.full_name, must_change_password: true });
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: data.role });
    await supabaseAdmin.from("audit_logs").insert({ actor_id: context.userId, action: "create_admin_user", entity: "user", entity_id: u.user.id, details: { email: data.email, role: data.role } });
    return { id: u.user.id };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role?: Role; is_active?: boolean; remove?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    if (data.userId === context.userId) throw new Error("You cannot change your own access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.role || data.remove) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).in("role", ["staff", "admin", "super_admin"]);
      if (data.role && !data.remove) await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    }
    if (typeof data.is_active === "boolean") {
      await supabaseAdmin.from("profiles").update({ is_active: data.is_active }).eq("id", data.userId);
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: data.is_active ? "none" : "876000h" });
    }
    await supabaseAdmin.from("audit_logs").insert({ actor_id: context.userId, action: "update_admin_user", entity: "user", entity_id: data.userId, details: data });
    return { ok: true };
  });
