import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { audit } from "@/lib/admin-client";

export const Route = createFileRoute("/admin_/change-password")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/admin/login", search: { redirect: undefined, denied: undefined } });
    return { userId: user.id };
  },
  head: () => ({ meta: [{ title: "Change password | Admin" }, { name: "description", content: "Set a new admin password." }, { name: "robots", content: "noindex" }] }),
  component: ChangePassword,
});

function ChangePassword() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return void toast.error("Use at least 8 characters with letters and numbers");
    if (pw !== pw2) return void toast.error("Passwords don't match");
    if (pw === cur) return void toast.error("New password must be different");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as never);
    if (error) { setBusy(false); return void toast.error(error.message); }
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
    await audit("change_password", "user", userId);
    setBusy(false);
    toast.success("Password updated");
    navigate({ to: "/admin" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-xl">
        <div><p className="font-display text-xl text-secondary">Set a new password</p><p className="text-sm text-muted-foreground">For security, please change your temporary password before continuing.</p></div>
        <div className="space-y-1.5"><Label htmlFor="c">Current password</Label><Input id="c" type="password" value={cur} onChange={(e) => setCur(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="n">New password</Label><Input id="n" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="n2">Confirm new password</Label><Input id="n2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </div>
  );
}
