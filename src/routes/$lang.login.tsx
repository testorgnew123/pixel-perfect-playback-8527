import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLang, useSettings } from "@/lib/use-lang";
import { waHref } from "@/lib/format";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : undefined };
  },
  head: ({ params }) => {
    const m = pageMeta(params.lang, { hi: "लॉगिन", en: "Sign in" }, { hi: "यात्रा बुक करने के लिए लॉगिन करें", en: "Sign in to book your yatra" });
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: Login,
});

// Sign-in methods are isolated per tab so phone OTP (MSG91/Twilio) can be added as another tab later.
function Login() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [f, setF] = useState({ email: "", password: "", name: "", mobile: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const done = () => { if (redirect) window.location.assign(redirect); else navigate({ to: "/$lang/account", params: { lang } }); };
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  const signin = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const { error } = await authClient.signIn.email({ email: f.email.trim(), password: f.password });
    if (error) return void toast.error(t("auth.wrong"));
    done();
  }); };
  const signup = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    if (!f.name.trim() || !f.email.trim()) return void toast.error(t("auth.required"));
    if (f.password.length < 8) return void toast.error(t("auth.pwMin"));
    const { data, error } = await authClient.signUp.email({ email: f.email.trim(), password: f.password, name: f.name.trim(), phone: f.mobile.trim() });
    if (error) return void toast.error(error.message ?? t("auth.wrong"));
    if (data?.token) done(); else toast.success(t("auth.checkEmail"), { duration: 10000 });
  }); };
  const sendCode = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: f.email.trim(), type: "sign-in" });
    if (error) return void toast.error(error.message ?? t("auth.wrong"));
    setCodeSent(true); toast.success(t("auth.codeSent"));
  }); };
  const verify = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const { error } = await authClient.signIn.emailOtp({ email: f.email.trim(), otp: f.code.trim() });
    if (error) return void toast.error(error.message ?? t("auth.wrong"));
    done();
  }); };
  const forgot = () => run(async () => {
    if (!f.email) return void toast.error(t("auth.required"));
    // See admin_.login.tsx: forgetPassword hits a 404 route in this better-auth version.
    const { error } = await authClient.requestPasswordReset({ email: f.email.trim(), redirectTo: "/reset-password" });
    if (error) toast.error(error.message ?? t("auth.wrong")); else toast.success(t("auth.resetSent"));
  });

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-center font-display text-3xl text-maroon">{t("auth.title")}</h1>
      <p className="mt-1 text-center text-muted-foreground">{t("auth.subtitle")}</p>
      <Tabs defaultValue="signin" className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
          <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
          <TabsTrigger value="otp">{t("auth.otp")}</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <form onSubmit={signin} className="space-y-4 pt-3">
            <div className="space-y-1.5"><Label htmlFor="li-email">{t("auth.email")}</Label><Input id="li-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} required className="h-12 text-base" /></div>
            <div className="space-y-1.5"><Label htmlFor="li-pw">{t("auth.password")}</Label><Input id="li-pw" type="password" autoComplete="current-password" value={f.password} onChange={set("password")} required className="h-12 text-base" /></div>
            <Button type="submit" className="h-12 w-full text-base" disabled={busy}>{t("auth.signin")}</Button>
            <button type="button" onClick={forgot} className="w-full text-sm text-maroon underline">{t("auth.forgot")}</button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={signup} className="space-y-4 pt-3">
            <div className="space-y-1.5"><Label htmlFor="su-name">{t("auth.name")}</Label><Input id="su-name" value={f.name} onChange={set("name")} required className="h-12 text-base" /></div>
            <div className="space-y-1.5"><Label htmlFor="su-mobile">{t("auth.mobile")}</Label><Input id="su-mobile" type="tel" value={f.mobile} onChange={set("mobile")} className="h-12 text-base" /></div>
            <div className="space-y-1.5"><Label htmlFor="su-email">{t("auth.email")}</Label><Input id="su-email" type="email" value={f.email} onChange={set("email")} required className="h-12 text-base" /></div>
            <div className="space-y-1.5"><Label htmlFor="su-pw">{t("auth.password")}</Label><Input id="su-pw" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} required className="h-12 text-base" /></div>
            <Button type="submit" className="h-12 w-full text-base" disabled={busy}>{t("auth.signup")}</Button>
          </form>
        </TabsContent>
        <TabsContent value="otp">
          <form onSubmit={codeSent ? verify : sendCode} className="space-y-4 pt-3">
            <div className="space-y-1.5"><Label htmlFor="otp-email">{t("auth.email")}</Label><Input id="otp-email" type="email" value={f.email} onChange={set("email")} required className="h-12 text-base" /></div>
            {codeSent && <div className="space-y-1.5"><Label htmlFor="otp-code">{t("auth.code")}</Label><Input id="otp-code" inputMode="numeric" value={f.code} onChange={set("code")} required className="h-12 text-base tracking-widest" /></div>}
            <Button type="submit" className="h-12 w-full text-base" disabled={busy}>{codeSent ? t("auth.verify") : t("auth.sendCode")}</Button>
          </form>
        </TabsContent>
      </Tabs>
      <p className="mt-4 text-center text-sm text-muted-foreground">{t("auth.areAgent")} <Link to="/$lang/agent/login" params={{ lang }} className="font-medium text-maroon underline">{t("nav.agentLogin")}</Link></p>
      <div className="mt-6 rounded-xl bg-secondary p-4 text-center text-sm">
        <p>{t("auth.phoneSoon")}</p>
        <Button asChild className="mt-3 bg-whatsapp text-primary-foreground hover:bg-whatsapp/90"><a href={waHref(s.whatsapp, t("whatsappMsg"))} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />{t("auth.whatsappBook")}</a></Button>
      </div>
    </div>
  );
}
