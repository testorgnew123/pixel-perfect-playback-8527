import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  yatra_interest: z.string().trim().max(200).optional(),
  preferred_month: z.string().trim().max(40).optional(),
  message: z.string().trim().max(1000).optional(),
});

export function EnquiryForm({ source = "home", yatraId, defaultYatra = "", compact = false, withMessage = false }: { source?: string; yatraId?: string; defaultYatra?: string; compact?: boolean; withMessage?: boolean }) {
  const { t } = useTranslation();
  const months = t("months", { returnObjects: true }) as string[];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(fd);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = String(i.path[0]);
        errs[k] = k === "mobile" ? t("form.invalidMobile") : k === "email" ? t("form.invalidEmail") : t("form.required");
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const v = parsed.data;
    const { error } = await supabase.from("enquiries").insert({
      name: v.name, mobile: v.mobile, email: v.email || null, yatra_interest: v.yatra_interest || null,
      preferred_month: v.preferred_month || null, message: v.message || null, source, yatra_id: yatraId ?? null,
    });
    setBusy(false);
    if (error) { toast.error(t("form.error")); return; }
    setDone(true);
    toast.success(t("form.thanks"));
  }

  if (done) return <p className="rounded-xl bg-success/10 p-6 text-center text-lg font-medium text-success">{t("form.thanks")}</p>;

  const field = "h-12 text-base bg-card";
  return (
    <form onSubmit={onSubmit} noValidate className={`grid gap-3 ${compact ? "" : "md:grid-cols-5"}`}>
      <div><Input name="name" placeholder={t("form.name")} aria-label={t("form.name")} className={field} />{errors["name"] && <p className="mt-1 text-sm text-destructive">{errors["name"]}</p>}</div>
      <div><Input name="mobile" inputMode="numeric" maxLength={10} placeholder={t("form.mobile")} aria-label={t("form.mobile")} className={field} />{errors["mobile"] && <p className="mt-1 text-sm text-destructive">{errors["mobile"]}</p>}</div>
      {compact && <div><Input name="email" type="email" placeholder={t("form.email")} aria-label={t("form.email")} className={field} />{errors["email"] && <p className="mt-1 text-sm text-destructive">{errors["email"]}</p>}</div>}
      <Input name="yatra_interest" defaultValue={defaultYatra} placeholder={t("form.yatra")} aria-label={t("form.yatra")} className={field} />
      <select name="preferred_month" aria-label={t("form.month")} className={`${field} rounded-md border border-input px-3`} defaultValue="">
        <option value="">{t("form.month")}</option>
        {months.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      {withMessage && <Textarea name="message" placeholder={t("form.message")} className="min-h-28 bg-card text-base" />}
      <Button type="submit" disabled={busy} size="lg" className="h-12 rounded-full bg-maroon text-base text-maroon-foreground hover:bg-maroon/90">{busy ? t("form.sending") : t("form.send")}</Button>
    </form>
  );
}
