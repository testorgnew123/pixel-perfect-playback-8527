import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/use-lang";
import { agentSignIn, getAgentEmailDomains } from "@/lib/agent.functions";
import { isAllowedAgentEmail } from "@/lib/commission";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/agent/login")({
  head: ({ params }) => {
    const m = pageMeta(params.lang, { hi: "एजेंट साइन इन", en: "Agent sign in" }, { hi: "एजेंटों के लिए साइन इन", en: "Sign in for agents" });
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: AgentLogin,
});

// Agents have no password: a one-time code goes to their website email, and agentSignIn (server)
// verifies it, checks the admin invite and the website-domain rule, then grants the agent role.
function AgentLogin() {
  const { t } = useTranslation();
  const lang = useLang();
  const domainsFn = useServerFn(getAgentEmailDomains);
  const signInFn = useServerFn(agentSignIn);
  const { data: domains } = useQuery({ queryKey: ["agent-domains"], queryFn: () => domainsFn(), staleTime: Infinity });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const domain = domains?.join(" / ") ?? "";

  const sendCode = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    if (domains && !isAllowedAgentEmail(email, domains)) return void toast.error(t("agent.wrongDomain", { domain }));
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
    if (error) return void toast.error(error.message ?? t("auth.wrong"));
    setSent(true); toast.success(t("agent.codeSent"));
  }); };
  const verify = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    try {
      await signInFn({ data: { email: email.trim(), otp: code.trim() } });
      window.location.assign(`/${lang}/agent`); // full reload so the session picks up the agent role
    } catch (err) { toast.error((err as Error).message || t("agent.notRegistered")); }
  }); };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-center font-display text-3xl text-maroon">{t("agent.loginTitle")}</h1>
      <p className="mt-1 text-center text-muted-foreground">{t("agent.loginSubtitle")}</p>
      <form onSubmit={sent ? verify : sendCode} className="mt-6 space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="ag-email">{t("agent.emailLabel")}</Label>
          <Input id="ag-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} required className="h-12 text-base" />
          {domain && <p className="text-xs text-muted-foreground">{t("agent.emailHint", { domain })}</p>}
        </div>
        {sent && <div className="space-y-1.5"><Label htmlFor="ag-code">{t("agent.codeLabel")}</Label><Input id="ag-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required className="h-12 text-base tracking-widest" /></div>}
        <Button type="submit" className="h-12 w-full text-base" disabled={busy}>{sent ? t("agent.verify") : t("agent.sendCode")}</Button>
      </form>
    </div>
  );
}
