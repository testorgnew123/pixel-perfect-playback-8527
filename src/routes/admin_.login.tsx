import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined; denied?: string | undefined } => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/admin") ? r : undefined, denied: s["denied"] ? String(s["denied"]) : undefined };
  },
  head: () => ({
    meta: [
      { title: "Admin login | Hari Shiv Shankar Tirth Yatra" },
      { name: "description", content: "Staff sign-in for Hari Shiv Shankar Tirth Yatra." },
      { name: "robots", content: "noindex" },
    ],
  }),
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
    const { error } = await authClient.signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (error) return void toast.error(error.message === "Invalid email or password" ? "Wrong email or password" : (error.message ?? "Could not sign in"));
    navigate({ to: redirect ?? "/admin" });
  }

  async function forgot() {
    if (!email) return void toast.error("Enter your email first");
    // requestPasswordReset, not forgetPassword: the latter posts to /api/auth/forget-password,
    // which this better-auth version answers with 404, so the button always failed.
    const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
    if (error) toast.error(error.message ?? "Could not send reset email");
    else toast.success("Password reset link sent to your email");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-maroon p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-xl">
        <div className="text-center">
          <p className="font-display text-2xl text-maroon">हरि शिव शंकर तीर्थ यात्रा</p>
          <p className="text-sm text-muted-foreground">Admin sign in</p>
        </div>
        {denied && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">This account doesn't have admin access.</p>}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        {/* text-primary was saffron on white at 2.49:1 — it read as inert text. */}
        <button type="button" onClick={forgot} className="h-11 w-full rounded-md text-center text-sm font-medium text-maroon underline underline-offset-4 hover:bg-secondary">
          Forgot password?
        </button>
      </form>
    </div>
  );
}
