import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { redirect?: string; denied?: string } => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/admin") ? r : undefined, denied: s["denied"] ? String(s["denied"]) : undefined };
  },
  head: () => ({ meta: [{ title: "Admin login | Hari Shiv Shankar Tirth Yatra" }, { name: "description", content: "Staff sign-in for Hari Shiv Shankar Tirth Yatra." }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const { redirect, denied } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return void toast.error(error.message === "Invalid login credentials" ? "Wrong email or password" : error.message);
    navigate({ to: redirect ?? "/admin" });
  }
  async function forgot() {
    if (!email) return void toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Password reset link sent to your email");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-xl">
        <div className="text-center">
          <p className="font-display text-2xl text-secondary">हरि शिव शंकर तीर्थ यात्रा</p>
          <p className="text-sm text-muted-foreground">Admin sign in</p>
        </div>
        {denied && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">This account doesn't have admin access.</p>}
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        <button type="button" onClick={forgot} className="w-full text-center text-sm text-primary underline">Forgot password?</button>
      </form>
    </div>
  );
}
