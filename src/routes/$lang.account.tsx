import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/use-lang";
import { useSessionUser } from "@/lib/use-session";
import { formatDate, formatINR, loc } from "@/lib/format";
import { requestCancellation } from "@/lib/booking.functions";
import { getMyBookings } from "@/lib/account.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/account")({
  head: ({ params }) => {
    const m = pageMeta(params.lang, { hi: "मेरी बुकिंग", en: "My bookings" }, { hi: "अपनी यात्रा बुकिंग देखें", en: "View your yatra bookings" });
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: Account,
});

function Account() {
  const { t } = useTranslation();
  const lang = useLang();
  const qc = useQueryClient();
  const { user, ready } = useSessionUser();
  const cancelFn = useServerFn(requestCancellation);
  const myBookingsFn = useServerFn(getMyBookings);
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: () => myBookingsFn(),
  });
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await authClient.signOut();
    window.location.assign(`/${lang}`);
  }
  async function cancel(id: string) {
    const reason = window.prompt(t("account.cancelReason")) ;
    if (reason === null) return;
    try {
      const r = await cancelFn({ data: { bookingId: id, reason } });
      toast.success(`${t("account.cancelSent")} (${formatINR(r.amount)}, ${r.percent}%)`);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch (e) { toast.error((e as Error).message); }
  }
  if (!ready) return <p className="p-10 text-center text-muted-foreground">{t("common.loading")}</p>;
  if (!user) return (
    <div className="mx-auto max-w-md px-4 py-14 text-center"><p className="text-lg">{t("book.loginToBook")}</p>
      <Button asChild size="lg" className="mt-4 h-12 rounded-full"><Link to="/$lang/login" params={{ lang }} search={{ redirect: `/${lang}/account` }}>{t("auth.signin")}</Link></Button></div>
  );
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl text-maroon">{t("account.title")}</h1><p className="text-muted-foreground">{user.email}</p></div>
        <Button variant="outline" onClick={signOut}>{t("auth.signout")}</Button>
      </div>
      {isLoading ? <p className="mt-6">{t("common.loading")}</p> : data.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-8 text-center"><p>{t("account.empty")}</p><Button asChild className="mt-4 rounded-full"><Link to="/$lang/yatras" params={{ lang }}>{t("account.browse")}</Link></Button></div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((b) => {
            const y = b.yatras as { title_en: string; title_hi: string | null; cover_image: string | null } | null;
            const d = b.departures as { start_date: string; end_date: string } | null;
            const due = Number(b.total_amount) - Number(b.amount_paid);
            return (
              <div key={b.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row">
                {y?.cover_image && <img src={y.cover_image} alt="" className="h-28 w-full rounded-xl object-cover sm:w-40" />}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg text-maroon">{loc(y, "title", lang)}</p><Badge variant={b.status === "confirmed" ? "default" : "outline"}>{t(`account.status.${b.status}`)}</Badge></div>
                  <p className="text-sm">{t("account.code")}: <b>{b.booking_code}</b> · {d && `${formatDate(d.start_date, lang)} – ${formatDate(d.end_date, lang)}`}</p>
                  <p className="text-sm">{t("account.travellers")}: {b.adults + b.children + b.infants} · {t("account.total")}: {formatINR(b.total_amount)} · {t("account.paid")}: {formatINR(b.amount_paid)}{due > 0 && !["cancelled", "refunded"].includes(b.status) ? ` · ${t("account.due")}: ${formatINR(due)}` : ""}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild size="sm" className="rounded-full"><Link to="/$lang/booking/$code" params={{ lang, code: b.booking_code }}>{t("account.view")}</Link></Button>
                    {["pending_payment", "partially_paid", "confirmed"].includes(b.status) && <Button size="sm" variant="outline" className="rounded-full" onClick={() => cancel(b.id)}>{t("account.cancel")}</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
