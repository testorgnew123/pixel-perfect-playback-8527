import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { token?: string } => ({
    token: typeof s["token"] === "string" ? s["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password | Hari Shiv Shankar Tirth Yatra" },
      { name: "description", content: "Choose a new password." },
      { property: "og:title", content: "Reset password" },
      { property: "og:description", content: "Choose a new password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return void toast.error("At least 8 characters");
    if (!token) return void toast.error("Invalid or expired reset link");
    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: pw, token });
    if (!error) await authClient.updateUser({ mustChangePassword: false });
    setBusy(false);
    if (error) return void toast.error(error.message ?? "Could not reset password");
    toast.success("Password updated");
    navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-maroon p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-xl">
        <p className="font-display text-xl text-maroon">Choose a new password</p>
        <div className="space-y-1.5">
          <Label htmlFor="p">New password</Label>
          <Input id="p" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}
