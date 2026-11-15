import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, Minus, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { bookingContextQuery } from "@/lib/queries";
import { useLang, useSettings } from "@/lib/use-lang";
import { useSessionUser } from "@/lib/use-session";
import { formatDate, formatINR, loc, waHref } from "@/lib/format";
import { agentCreateBooking, createBooking, joinWaitlist, quoteBooking, type TravellerIn } from "@/lib/booking.functions";
import { getAgentMe } from "@/lib/agent.functions";
import { computeCommission } from "@/lib/commission";
import type { Sharing } from "@/lib/pricing";
import { RouteError, RouteNotFound } from "@/components/site/ui";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/$lang/book/$departureId")({
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(bookingContextQuery(params.departureId));
    if (!c) throw notFound();
    return c;
  },
  head: ({ params, loaderData }) => {
    const m = pageMeta(params.lang, { hi: `बुकिंग – ${loaderData?.y.title_hi ?? loaderData?.y.title_en ?? ""}`, en: `Book – ${loaderData?.y.title_en ?? ""}` }, { hi: "अपनी तीर्थ यात्रा बुक करें", en: "Book your pilgrimage" });
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: Book,
  errorComponent: ({ error }) => <RouteError error={error} />,
  notFoundComponent: () => <RouteNotFound />,
});

type Q = Awaited<ReturnType<typeof quoteBooking>>;
const blankT = (type: TravellerIn["traveller_type"]): TravellerIn => ({ traveller_type: type, full_name: "", age: null, gender: "", mobile: "", id_type: "Aadhaar", id_number: "", medical_condition: "", meal_pref: "veg" });

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-3">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button type="button" size="icon" variant="outline" className="h-10 w-10 rounded-full" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="-"><Minus className="h-4 w-4" /></Button>
        <span className="w-6 text-center text-lg font-semibold">{value}</span>
        <Button type="button" size="icon" variant="outline" className="h-10 w-10 rounded-full" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="+"><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function Book() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { departureId } = Route.useParams();
  const { data } = useSuspenseQuery(bookingContextQuery(departureId));
  const { dep, y } = data!;
  const { user, ready } = useSessionUser();
  const quoteFn = useServerFn(quoteBooking);
  const bookFn = useServerFn(createBooking);
  const agentBookFn = useServerFn(agentCreateBooking);
  const agentMeFn = useServerFn(getAgentMe);
  const waitFn = useServerFn(joinWaitlist);
  // Agents book on behalf of a customer: no prefill from their own profile, their own server fn, and a commission estimate.
  // UI mode only; agentCreateBooking re-checks the agent on the server.
  const agentMode = !!user?.isAgent;
  const { data: agentMe } = useQuery({ queryKey: ["agent", "me", user?.id], enabled: agentMode, queryFn: () => agentMeFn() });
  const [step, setStep] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const pr = (y.yatra_pricing ?? null) as Partial<Record<Sharing, number | null>> | null;
  const sharings = (["quad", "triple", "twin", "single"] as Sharing[]).filter((k) => pr?.[k]);
  const [sharing, setSharing] = useState<Sharing>(sharings.includes("twin") ? "twin" : sharings[0] ?? "twin");
  const [pickup, setPickup] = useState<string>("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [travellers, setTravellers] = useState<TravellerIn[]>([]);
  const [contact, setContact] = useState({ name: "", mobile: "", email: "", city: "" });
  const [consent, setConsent] = useState(false);
  const [quote, setQuote] = useState<Q | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const seatsLeft = dep.total_seats - dep.booked_seats;
  const full = seatsLeft <= 0 || dep.status === "sold_out" || dep.status === "closed";

  useEffect(() => {
    const want: TravellerIn["traveller_type"][] = [...Array(adults)].map((): TravellerIn["traveller_type"] => "adult").concat([...Array(children)].map(() => "child" as const), [...Array(infants)].map(() => "infant" as const));
    setTravellers((prev) => want.map((type, i) => (prev[i]?.traveller_type === type ? prev[i]! : blankT(type))));
  }, [adults, children, infants]);
  useEffect(() => {
    if (user && !user.isAgent && !contact.email) setContact((c) => ({ ...c, email: user.email ?? "", name: user.name ?? c.name, mobile: user.phone ?? c.mobile }));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const req = useMemo(() => ({ departureId, adults, children, infants, sharing, pickupCityId: pickup || null, addonIds, couponCode: appliedCoupon || null }), [departureId, adults, children, infants, sharing, pickup, addonIds, appliedCoupon]);
  useEffect(() => {
    let live = true;
    setQuote(null);
    quoteFn({ data: req }).then((q) => { if (live) setQuote(q); }).catch((e) => toast.error(String(e.message ?? e)));
    return () => { live = false; };
  }, [req]); // eslint-disable-line react-hooks/exhaustive-deps

  const loginHref = `/${lang}/login?redirect=${encodeURIComponent(`/${lang}/book/${departureId}`)}`;
  const title = loc(y, "title", lang);
  const updT = (i: number, p: Partial<TravellerIn>) => setTravellers((ts) => ts.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function submit() {
    if (!consent) return;
    setBusy(true);
    try {
      const payload = { ...req, travellers, contact, consent, lang };
      const r = agentMode ? await agentBookFn({ data: payload }) : await bookFn({ data: payload });
      if (!r.ok) { toast.error(t("book.noSeats")); return; }
      setDone({ code: r.code });
      window.scrollTo({ top: 0 });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function waitlist() {
    if (!contact.name || !contact.mobile) return void toast.error(t("auth.required"));
    try { await waitFn({ data: { departureId, name: contact.name, mobile: contact.mobile, email: contact.email, seats: adults + children } }); toast.success(t("book.waitlistDone")); } catch (e) { toast.error((e as Error).message); }
  }
  const commission = agentMode && quote && agentMe ? computeCommission({ total: quote.total, gst: quote.gst, percent: agentMe.rate }).amount : null;
  const step2Valid =travellers.every((x) => x.full_name.trim() && x.age != null) && contact.name.trim() && /^[0-9+\s-]{10,15}$/.test(contact.mobile);

  if (done) return (
    <div className="mx-auto max-w-lg px-4 py-14 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
      <h1 className="mt-4 font-display text-3xl text-maroon">{t("book.success")}</h1>
      <p className="mt-3 text-lg">{t(agentMode ? "agent.successText" : "book.successText", { code: done.code })}</p>
      <Button asChild size="lg" className="mt-6 h-12 rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90"><Link to="/$lang/booking/$code" params={{ lang, code: done.code }}>{t("book.viewBooking")}</Link></Button>
    </div>
  );

  const Summary = (
    <div className="space-y-2 rounded-2xl border bg-card p-4 text-[15px]">
      <p className="font-display text-lg text-maroon">{t("book.priceBreakup")}</p>
      {!quote ? <p className="text-muted-foreground">{t("book.pending")}</p> : <>
        <Row l={`${t("book.base")} (${adults + children + infants})`} v={formatINR(quote.base)} />
        {quote.addons > 0 && <Row l={t("book.addonsAmt")} v={formatINR(quote.addons)} />}
        {quote.pickup > 0 && <Row l={t("book.pickupAmt")} v={formatINR(quote.pickup)} />}
        {quote.discount > 0 && <Row l={t("book.discount")} v={`− ${formatINR(quote.discount)}`} />}
        <Row l={`${t("book.gst")}${y.gst_inclusive ? ` (${t("book.gstIncl")})` : ""}`} v={formatINR(quote.gst)} />
        <div className="flex justify-between border-t pt-2 text-lg font-semibold"><span>{t("book.total")}</span><span className="text-maroon">{formatINR(quote.total)}</span></div>
        <Row l={t("book.advance")} v={formatINR(quote.advance)} />
        {commission !== null && <Row l={t("agent.yourCommission")} v={formatINR(commission)} />}
      </>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex gap-4 rounded-2xl border bg-card p-3">
        {y.cover_image && <img src={y.cover_image} alt="" className="h-20 w-28 rounded-xl object-cover" />}
        <div><h1 className="font-display text-xl text-maroon md:text-2xl">{title}</h1><p className="text-muted-foreground">{formatDate(dep.start_date, lang)} – {formatDate(dep.end_date, lang)}</p><p className={seatsLeft < 10 ? "font-semibold text-destructive" : "text-sm"}>{full ? t("book.soldOut") : t("book.seatsLeft", { count: seatsLeft })}</p></div>
      </div>
      {agentMode && <div className="mb-5 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-sm"><p className="font-semibold">{t("agent.bannerTitle")}</p><p>{t("agent.bannerText", { amount: commission !== null ? formatINR(commission) : "…" })}</p></div>}
      <ol className="mb-5 flex gap-2 text-sm">{[1, 2, 3].map((n) => <li key={n} className={`flex-1 rounded-full px-3 py-2 text-center ${step === n ? "bg-maroon text-maroon-foreground" : "bg-secondary"}`}>{n}. {t(`book.step${n}`)}</li>)}</ol>

      {ready && !user ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-lg">{t("book.loginToBook")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full"><a href={loginHref}>{t("auth.signin")}</a></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full"><a href={waHref(s.whatsapp, `${t("whatsappMsg")} – ${title} (${formatDate(dep.start_date, lang)})`)} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />{t("auth.whatsappBook")}</a></Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {step === 1 && <>
              <Counter label={t("book.adults")} value={adults} min={1} max={20} onChange={setAdults} />
              <Counter label={t("book.children")} value={children} min={0} max={10} onChange={setChildren} />
              <Counter label={t("book.infants")} value={infants} min={0} max={5} onChange={setInfants} />
              {sharings.length > 0 && <fieldset className="rounded-xl border bg-card p-3"><legend className="px-1 font-medium">{t("book.sharing")}</legend>
                <div className="grid gap-2 sm:grid-cols-2">{sharings.map((k) => <label key={k} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${sharing === k ? "border-primary bg-primary/10" : ""}`}><span><input type="radio" className="mr-2" checked={sharing === k} onChange={() => setSharing(k)} />{t(`book.${k}`)}</span><span className="font-semibold">{formatINR(dep.price_override ?? pr?.[k])}</span></label>)}</div>
              </fieldset>}
              {y.yatra_pickup_cities.length > 0 && <div className="rounded-xl border bg-card p-3"><Label htmlFor="pickup" className="font-medium">{t("book.pickup")}</Label>
                <select id="pickup" className="mt-2 h-12 w-full rounded-md border bg-background px-3 text-base" value={pickup} onChange={(e) => setPickup(e.target.value)}>
                  <option value="">{t("book.noPickup")}</option>
                  {y.yatra_pickup_cities.map((p) => <option key={p.id} value={p.id}>{loc(p, "city", lang)}{p.extra_charge ? ` (+${formatINR(p.extra_charge)} ${t("book.perPerson")})` : ""}{p.reporting_time ? ` · ${p.reporting_time}` : ""}</option>)}
                </select></div>}
              {y.yatra_addons.length > 0 && <div className="space-y-2 rounded-xl border bg-card p-3"><p className="font-medium">{t("book.addons")}</p>
                {y.yatra_addons.map((a) => <label key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="flex items-center gap-2"><Checkbox checked={addonIds.includes(a.id)} onCheckedChange={(c) => setAddonIds((ids) => (c ? [...ids, a.id] : ids.filter((x) => x !== a.id)))} />{loc(a, "name", lang)}</span><span>{formatINR(a.price)}{a.per_person ? ` / ${t("book.perPerson")}` : ""}</span></label>)}</div>}
              <div className="flex gap-2 rounded-xl border bg-card p-3">
                <Input placeholder={t("book.coupon")} value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="h-11" />
                <Button type="button" variant="outline" className="h-11" onClick={() => setAppliedCoupon(coupon.trim())}>{t("book.apply")}</Button>
              </div>
              {appliedCoupon && quote && (quote.couponApplied ? <p className="text-sm text-success">{t("book.couponOk")}</p> : quote.couponError && <p className="text-sm text-destructive">{t(`book.couponErr.${quote.couponError}`)}</p>)}
              {full || (quote && quote.seatsLeft < adults + children) ? (
                <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                  <p className="font-medium">{full ? t("book.soldOut") : t("book.noSeats")}</p>
                  <Input placeholder={t("auth.name")} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="h-11" />
                  <Input placeholder={t("auth.mobile")} value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} className="h-11" />
                  <Button onClick={waitlist} className="h-12 w-full">{t("book.joinWaitlist")}</Button>
                </div>
              ) : <Button size="lg" className="h-12 w-full rounded-full text-base" onClick={() => setStep(2)} disabled={!quote}>{t("book.next")}</Button>}
            </>}

            {step === 2 && <>
              {travellers.map((x, i) => (
                <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
                  <p className="font-display text-lg text-maroon">{t("book.traveller", { n: i + 1 })} · {t(`book.${x.traveller_type}`)}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2"><Label>{t("book.fullName")} *</Label><Input className="h-11" value={x.full_name} onChange={(e) => updT(i, { full_name: e.target.value })} /></div>
                    <div className="space-y-1"><Label>{t("book.age")} *</Label><Input className="h-11" type="number" inputMode="numeric" value={x.age ?? ""} onChange={(e) => updT(i, { age: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                    <div className="space-y-1"><Label>{t("book.gender")}</Label><select className="h-11 w-full rounded-md border bg-background px-3" value={x.gender} onChange={(e) => updT(i, { gender: e.target.value })}><option value="">—</option><option value="male">{t("book.male")}</option><option value="female">{t("book.female")}</option><option value="other">{t("book.other")}</option></select></div>
                    {x.traveller_type !== "infant" && <>
                      <div className="space-y-1"><Label>{t("book.idType")}</Label><select className="h-11 w-full rounded-md border bg-background px-3" value={x.id_type} onChange={(e) => updT(i, { id_type: e.target.value })}>{["Aadhaar", "PAN", "Passport", "Voter ID", "Driving Licence"].map((o) => <option key={o}>{o}</option>)}</select></div>
                      <div className="space-y-1"><Label>{t("book.idNumber")}</Label><Input className="h-11" value={x.id_number} onChange={(e) => updT(i, { id_number: e.target.value })} autoComplete="off" /><p className="text-xs text-muted-foreground">{t("book.idNote")}</p></div>
                    </>}
                    <div className="space-y-1"><Label>{t("book.meal")}</Label><select className="h-11 w-full rounded-md border bg-background px-3" value={x.meal_pref} onChange={(e) => updT(i, { meal_pref: e.target.value })}><option value="veg">{t("book.veg")}</option><option value="jain">{t("book.jain")}</option><option value="satvik">{t("book.satvik")}</option></select></div>
                    <div className="space-y-1"><Label>{t("book.medical")}</Label><Input className="h-11" value={x.medical_condition} onChange={(e) => updT(i, { medical_condition: e.target.value })} /></div>
                  </div>
                </div>
              ))}
              <div className="space-y-3 rounded-xl border bg-card p-4">
                <p className="font-display text-lg text-maroon">{t("book.contact")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label>{t("auth.name")} *</Label><Input className="h-11" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></div>
                  <div className="space-y-1"><Label>{t("auth.mobile")} *</Label><Input className="h-11" type="tel" value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} /></div>
                  <div className="space-y-1"><Label>{t("auth.email")}</Label><Input className="h-11" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
                  <div className="space-y-1"><Label>{t("book.city")}</Label><Input className="h-11" value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} /></div>
                </div>
              </div>
              <div className="flex gap-3"><Button variant="outline" size="lg" className="h-12 rounded-full" onClick={() => setStep(1)}>{t("book.back")}</Button><Button size="lg" className="h-12 flex-1 rounded-full" disabled={!step2Valid} onClick={() => setStep(3)}>{t("book.next")}</Button></div>
            </>}

            {step === 3 && <>
              <div className="space-y-1 rounded-xl border bg-card p-4 text-[15px]">
                <p><b>{t("book.adults")}:</b> {adults} · <b>{t("book.children")}:</b> {children} · <b>{t("book.infants")}:</b> {infants}</p>
                <p><b>{t("book.sharing")}:</b> {t(`book.${sharing}`)}</p>
                {pickup && <p><b>{t("book.pickup")}:</b> {loc(y.yatra_pickup_cities.find((p) => p.id === pickup), "city", lang)}</p>}
                <p><b>{t("account.travellers")}:</b> {travellers.map((x) => x.full_name).join(", ")}</p>
                <p><b>{t("book.contact")}:</b> {contact.name}, {contact.mobile}</p>
              </div>
              <p className="rounded-xl bg-secondary p-4">{t(agentMode ? "agent.payLater" : "book.payLater")}</p>
              <label className="flex items-start gap-3 rounded-xl border bg-card p-4"><Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} className="mt-1" /><span className="text-sm">{t("book.consent")}</span></label>
              <div className="flex gap-3"><Button variant="outline" size="lg" className="h-12 rounded-full" onClick={() => setStep(2)}>{t("book.back")}</Button><Button size="lg" className="h-12 flex-1 rounded-full bg-maroon text-base text-maroon-foreground hover:bg-maroon/90" disabled={!consent || busy || !quote} onClick={submit}>{busy ? "…" : t("book.confirm")}</Button></div>
            </>}
          </div>
          <div className="md:sticky md:top-20 md:self-start">{Summary}</div>
        </div>
      )}
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>;
}
