import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset password | Hari Shiv Shankar Tirth Yatra" }, { name: "description", content: "Choose a new password." }, { property: "og:title", content: "Reset password" }, { property: "og:description", content: "Choose a new password." }, { name: "robots", content: "noindex" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("At least 8 characters");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (!error && user) await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/admin" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-xl">
        <p className="font-display text-xl text-secondary">Choose a new password</p>
        <div className="space-y-1.5"><Label htmlFor="p">New password</Label><Input id="p" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <Button className="w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </div>
  );
}
