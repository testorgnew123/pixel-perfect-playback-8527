import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { getBookingVoucher } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { useLang, useSettings } from "@/lib/use-lang";
import { useSessionUser } from "@/lib/use-session";
import { formatDate, formatINR, loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/booking/$code")({
  head: ({ params }) => {
    const m = pageMeta(params.lang, { hi: `बुकिंग ${params.code}`, en: `Booking ${params.code}` }, { hi: "बुकिंग वाउचर और इनवॉइस", en: "Booking voucher and invoice" });
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: Voucher,
});

function Voucher() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { code } = Route.useParams();
  const { user, ready } = useSessionUser();
  const voucherFn = useServerFn(getBookingVoucher);
  const { data, isLoading } = useQuery({
    queryKey: ["voucher", code, user?.id],
    enabled: !!user,
    queryFn: () => voucherFn({ data: { code } }),
  });
  if (!ready || isLoading) return <p className="p-10 text-center text-muted-foreground">{t("common.loading")}</p>;
  if (!user) return <div className="p-10 text-center"><Button asChild className="rounded-full"><Link to="/$lang/login" params={{ lang }} search={{ redirect: `/${lang}/booking/${code}` }}>{t("auth.signin")}</Link></Button></div>;
  if (!data) return <p className="p-10 text-center">{t("notFound.title", { defaultValue: "Not found" })}</p>;
  const { b, travellers, addons, payments, pickup } = data;
  const y = b.yatras as { title_en: string; title_hi: string | null } | null;
  const d = b.departures as { start_date: string; end_date: string } | null;
  const c = b.contact as { name?: string; mobile?: string; email?: string; city?: string };
  const taxable = Number(b.total_amount) - Number(b.gst_amount);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 print:max-w-none print:p-0">
      <div className="flex justify-end print:hidden"><Button onClick={() => window.print()} className="rounded-full"><Printer className="mr-2 h-4 w-4" />{t("account.print")}</Button></div>
      <section className="rounded-2xl border bg-card p-6 print:border-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div><p className="font-display text-2xl text-maroon">{s.brand}</p><p className="text-sm text-muted-foreground">{s.phone} · {s.email}</p></div>
          <div className="text-right"><p className="text-sm text-muted-foreground">{t("account.voucher")}</p><p className="text-xl font-bold">{b.booking_code}</p><p className="text-sm">{t(`account.status.${b.status}`)}</p></div>
        </div>
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div><p className="text-sm text-muted-foreground">Yatra</p><p className="font-semibold">{loc(y, "title", lang)}</p></div>
          <div><p className="text-sm text-muted-foreground">{t("account.dates")}</p><p className="font-semibold">{d && `${formatDate(d.start_date, lang)} – ${formatDate(d.end_date, lang)}`}</p></div>
          {pickup && <div><p className="text-sm text-muted-foreground">{t("account.pickup")}</p><p className="font-semibold">{loc(pickup, "city", lang)} {pickup.reporting_time && `· ${pickup.reporting_time}`}</p><p className="text-sm">{loc(pickup, "reporting_place", lang)}</p></div>}
          <div><p className="text-sm text-muted-foreground">{t("book.contact")}</p><p className="font-semibold">{c.name} · {c.mobile}</p></div>
        </div>
        <table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="p-2">#</th><th className="p-2">{t("book.fullName")}</th><th className="p-2">{t("book.age")}</th><th className="p-2">{t("book.idType")}</th><th className="p-2">{t("book.meal")}</th></tr></thead>
          <tbody>{travellers.map((x, i) => <tr key={x.id} className="border-t"><td className="p-2">{i + 1}</td><td className="p-2">{x.full_name} <span className="text-muted-foreground">({t(`book.${x.traveller_type}`)})</span></td><td className="p-2">{x.age}</td><td className="p-2">{x.id_type ? `${x.id_type} XXXX${x.id_last4 ?? ""}` : "—"}</td><td className="p-2">{x.meal_pref}</td></tr>)}</tbody></table>
      </section>
      <section className="rounded-2xl border bg-card p-6 print:break-before-page print:border-0">
        <div className="flex flex-wrap justify-between gap-3 border-b pb-4">
          <div><p className="font-display text-xl text-maroon">{t("account.invoice")}</p><p className="text-sm">{s.brand}</p><p className="text-sm text-muted-foreground">{loc(s, "address", lang)}</p>{s.gst_number && <p className="text-sm">{t("account.gstin")}: {s.gst_number}</p>}</div>
          <div className="text-right text-sm"><p>No: INV-{b.booking_code}</p><p>{formatDate(b.created_at, lang)}</p><p className="mt-2 text-muted-foreground">{t("account.billTo")}</p><p>{c.name}</p><p>{c.city}</p></div>
        </div>
        <div className="space-y-1.5 py-4 text-[15px]">
          <L l={t("book.base")} v={formatINR(b.base_amount)} />
          {addons.map((a) => <L key={a.id} l={`${loc(a, "name", lang)} × ${a.qty}`} v={formatINR(Number(a.price) * a.qty)} />)}
          {Number(b.pickup_amount) > 0 && <L l={t("book.pickupAmt")} v={formatINR(b.pickup_amount)} />}
          {Number(b.discount_amount) > 0 && <L l={`${t("book.discount")}${b.coupon_code ? ` (${b.coupon_code})` : ""}`} v={`− ${formatINR(b.discount_amount)}`} />}
          <L l="Taxable value" v={formatINR(taxable)} />
          <L l={`CGST`} v={formatINR(Number(b.gst_amount) / 2)} />
          <L l={`SGST`} v={formatINR(Number(b.gst_amount) / 2)} />
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>{t("book.total")}</span><span>{formatINR(b.total_amount)}</span></div>
          <L l={t("account.paid")} v={formatINR(b.amount_paid)} />
          <L l={t("account.due")} v={formatINR(Math.max(0, Number(b.total_amount) - Number(b.amount_paid)))} />
        </div>
        {payments.length > 0 && <><p className="font-medium">{t("account.payments")}</p><ul className="text-sm">{payments.map((p) => <li key={p.id}>{formatDate(p.created_at, lang)} · {p.method} · {formatINR(p.amount)}</li>)}</ul></>}
      </section>
    </div>
  );
}
function L({ l, v }: { l: string; v: string }) { return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>; }
