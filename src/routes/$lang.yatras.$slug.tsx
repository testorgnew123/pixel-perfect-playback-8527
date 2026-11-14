import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Check, Clock, Download, MapPin, MessageCircle, Phone, Share2, Star, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { yatraQuery } from "@/lib/queries";
import { useLang, useSettings } from "@/lib/use-lang";
import { departureStatus, discountPercent, formatDate, formatINR, loc, locArr, seatsLeft, telHref, waHref } from "@/lib/format";
import { DEFAULT_OG_IMAGE, absUrl, breadcrumbLd, ldScript, toLang } from "@/lib/seo";
import { RouteError, RouteNotFound, SectionHeading, StatusBadge, YatraCard } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";

export const Route = createFileRoute("/$lang/yatras/$slug")({
  loader: async ({ context, params }) => {
    const y = await context.queryClient.ensureQueryData(yatraQuery(params.slug));
    if (!y) throw notFound();
    return y;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Yatra" }, { name: "robots", content: "noindex" }] };
    const hi = params.lang !== "en";
    const lang = toLang(params.lang);
    const title = (hi ? loaderData.meta_title_hi || loaderData.title_hi : loaderData.meta_title_en) || loaderData.title_en;
    const desc = (hi ? loaderData.meta_desc_hi || loaderData.short_desc_hi : loaderData.meta_desc_en || loaderData.short_desc_en) ?? "";
    const image = loaderData.og_image || loaderData.cover_image;
    const img = absUrl(image || DEFAULT_OG_IMAGE);
    const url = absUrl(`/${lang}/yatras/${loaderData.slug}`);
    // Localised, so the Hindi page does not publish English structured data that
    // contradicts what the visitor reads.
    const name = (hi ? loaderData.title_hi : loaderData.title_en) || loaderData.title_en;
    const description = (hi ? loaderData.short_desc_hi : loaderData.short_desc_en) || loaderData.short_desc_en || desc;
    const rating = Number(loaderData.rating);
    const reviews = Number(loaderData.review_count);
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      scripts: [
        ldScript({
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name,
          description,
          url,
          ...(image ? { image: absUrl(image) } : {}),
          ...(loaderData.duration_days ? { itinerary: { "@type": "ItemList", numberOfItems: loaderData.duration_days } } : {}),
          ...(loaderData.senior_friendly ? { touristType: hi ? "वरिष्ठ नागरिक अनुकूल" : "Senior-friendly" } : {}),
          ...(Number.isFinite(rating) && rating > 0 && Number.isFinite(reviews) && reviews > 0
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: reviews } }
            : {}),
          offers: {
            "@type": "Offer",
            price: loaderData.price,
            priceCurrency: "INR",
            url,
            availability: "https://schema.org/InStock",
          },
        }),
        breadcrumbLd([
          { name: hi ? "होम" : "Home", path: `/${lang}` },
          { name: hi ? "सभी यात्राएँ" : "All Yatras", path: `/${lang}/yatras` },
          { name, path: `/${lang}/yatras/${loaderData.slug}` },
        ]),
      ],
    };
  },
  component: YatraDetail,
  errorComponent: ({ error }) => <RouteError error={error} />,
  notFoundComponent: () => <RouteNotFound />,
});

function YatraDetail() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(yatraQuery(slug));
  const y = data!;
  const [img, setImg] = useState(0);
  const off = discountPercent(y.original_price, y.price);
  const title = loc(y, "title", lang);
  const pricing = y.yatra_pricing;
  const items = (k: string) => y.yatra_list_items.filter((i) => i.kind === k);
  const next = y.departures.find((d) => departureStatus(d) !== "sold_out" && d.status !== "closed");
  const bookMsg = (date?: string) => `${t("whatsappMsg")} – ${title}${date ? ` (${formatDate(date, lang)})` : ""}`;
  const sections = ["overview", "itinerary", "inclusions", "departures", "pricing", "carry", "notes", "cancellation", "faqs", "reviews", "map"] as const;

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid gap-3 md:grid-cols-[3fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={y.yatra_images[img]?.url ?? y.cover_image ?? ""} alt={loc(y.yatra_images[img], "alt", lang) || title} className="aspect-[16/9] h-full w-full object-cover md:aspect-auto md:max-h-[560px]" />
            {off > 0 && <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 font-semibold text-destructive-foreground">{t("common.off", { p: off })}</span>}
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:max-h-[560px]">
            {y.yatra_images.slice(0, 3).map((im, i) => (
              <button key={im.id} onClick={() => setImg(i)} className={`overflow-hidden rounded-xl ring-2 ${i === img ? "ring-primary" : "ring-transparent"}`}>
                <img src={im.url} alt={loc(im, "alt", lang)} loading="lazy" className="aspect-[4/3] h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-maroon md:text-4xl">{title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-[15px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{t("common.daysNights", { d: y.duration_days, n: y.duration_nights })}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{t("common.startingCity")}: {loc(y, "starting_city", lang)}</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-gold text-gold" />{t("common.rating", { r: Number(y.rating).toFixed(1), c: y.review_count })}</span>
          </div>

          <nav className="sticky top-16 z-20 -mx-4 mt-6 flex gap-1 overflow-x-auto border-y border-border bg-background/95 px-4 py-2 backdrop-blur lg:top-20">
            {sections.map((k) => <a key={k} href={`#${k}`} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-secondary">{t(`detail.tabs.${k}`)}</a>)}
          </nav>

          <Sec id="overview" title={t("detail.tabs.overview")}>
            <p className="whitespace-pre-line text-[17px]">{loc(y, "overview", lang)}</p>
            <h3 className="mt-6 text-lg font-semibold">{t("detail.tabs.highlights")}</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">{locArr(y, "highlights", lang).map((h) => <li key={h} className="flex gap-2"><Check className="mt-1 h-5 w-5 text-success" />{h}</li>)}</ul>
          </Sec>

          <Sec id="itinerary" title={t("detail.tabs.itinerary")}>
            <Accordion type="multiple" defaultValue={["d1"]} className="rounded-2xl border border-border bg-card">
              {y.yatra_itinerary_days.map((d) => (
                <AccordionItem key={d.id} value={`d${d.day_number}`} className="px-4">
                  <AccordionTrigger className="text-left text-base"><span><span className="mr-2 rounded-md bg-gradient-saffron px-2 py-0.5 text-sm font-bold text-maroon">{t("detail.day", { n: d.day_number })}</span>{loc(d, "title", lang)}</span></AccordionTrigger>
                  <AccordionContent className="text-[16px]">
                    <p>{loc(d, "description", lang)}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {d.meals.length > 0 && <span>{t("detail.meals")}: {d.meals.join(", ")}</span>}
                      {d.overnight_en && <span>{t("detail.overnight")}: {loc(d, "overnight", lang)}</span>}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Sec>

          <Sec id="inclusions" title={t("detail.tabs.inclusions")}>
            <div className="grid gap-6 md:grid-cols-2">
              <div><h3 className="mb-2 font-semibold text-success">{t("detail.inclusions")}</h3><ul className="space-y-2">{items("inclusion").map((i) => <li key={i.id} className="flex gap-2"><Check className="mt-1 h-5 w-5 shrink-0 text-success" />{loc(i, "text", lang)}</li>)}</ul></div>
              <div><h3 className="mb-2 font-semibold text-destructive">{t("detail.exclusions")}</h3><ul className="space-y-2">{items("exclusion").map((i) => <li key={i.id} className="flex gap-2"><X className="mt-1 h-5 w-5 shrink-0 text-destructive" />{loc(i, "text", lang)}</li>)}</ul></div>
            </div>
          </Sec>

          <Sec id="departures" title={t("detail.tabs.departures")}>
            {y.departures.length === 0 ? <p className="text-muted-foreground">{t("detail.noDepartures")}</p> : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[640px] text-[15px]">
                  <thead className="bg-secondary text-left text-sm text-maroon"><tr>{["date", "return", "seats", "price", "status", ""].map((k) => <th key={k} className="px-4 py-3 font-semibold">{k ? t(`detail.${k}`) : ""}</th>)}</tr></thead>
                  <tbody>
                    {y.departures.map((d) => {
                      const left = seatsLeft(d); const st = departureStatus(d);
                      return (
                        <tr key={d.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">{formatDate(d.start_date, lang)}</td>
                          <td className="px-4 py-3">{formatDate(d.end_date, lang)}</td>
                          <td className="px-4 py-3"><div className="w-28"><div className={`text-sm ${left < 10 ? "font-semibold text-destructive" : ""}`}>{t("common.seatsLeftPlain", { count: left })}</div><Progress value={(d.booked_seats / d.total_seats) * 100} className="mt-1 h-2" /></div></td>
                          <td className="px-4 py-3 font-semibold text-maroon">{formatINR(d.price_override ?? y.price)}</td>
                          <td className="px-4 py-3"><StatusBadge status={st === "sold_out" ? "waitlist" : st} /></td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild size="sm" className="rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90">
                              <Link to="/$lang/book/$departureId" params={{ lang, departureId: d.id }}>{st === "sold_out" ? t("detail.joinWaitlist") : t("detail.book")}</Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Sec>

          <Sec id="pricing" title={t("detail.tabs.pricing")}>
            {pricing && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(["quad", "triple", "twin", "single", "child", "infant"] as const).map((k) => pricing[k] != null && (
                  <div key={k} className="rounded-xl border border-border bg-card p-4"><div className="text-sm text-muted-foreground">{t(`detail.${k}`)}</div><div className="text-xl font-bold text-maroon">{formatINR(pricing[k])}</div></div>
                ))}
              </div>
            )}
            <p className="mt-2 text-sm text-muted-foreground">{t("common.perPerson")} {y.gst_inclusive ? "" : t("detail.gstNote", { p: y.gst_percent })}</p>
            {y.yatra_addons.length > 0 && <><h3 className="mt-6 font-semibold">{t("detail.addons")}</h3><ul className="mt-2 grid gap-2 sm:grid-cols-2">{y.yatra_addons.map((a) => <li key={a.id} className="flex justify-between rounded-lg bg-secondary px-4 py-2.5"><span>{loc(a, "name", lang)}</span><span className="font-semibold">{formatINR(a.price)}</span></li>)}</ul></>}
            {y.yatra_pickup_cities.length > 0 && <><h3 className="mt-6 font-semibold">{t("detail.pickup")}</h3><ul className="mt-2 grid gap-2 sm:grid-cols-2">{y.yatra_pickup_cities.map((p) => <li key={p.id} className="flex justify-between rounded-lg border border-border px-4 py-2.5"><span>{loc(p, "city", lang)} <span className="text-sm text-muted-foreground">· {p.reporting_time}</span></span><span className="font-semibold">{Number(p.extra_charge) ? t("detail.extra", { amt: formatINR(p.extra_charge) }) : "—"}</span></li>)}</ul></>}
          </Sec>

          <Sec id="carry" title={t("detail.tabs.carry")}><ul className="space-y-2">{items("carry").map((i) => <li key={i.id} className="flex gap-2"><Check className="mt-1 h-5 w-5 text-primary" />{loc(i, "text", lang)}</li>)}</ul></Sec>
          <Sec id="notes" title={t("detail.tabs.notes")}><ul className="space-y-2 rounded-2xl bg-secondary p-5">{items("note").map((i) => <li key={i.id}>• {loc(i, "text", lang)}</li>)}</ul></Sec>
          <Sec id="cancellation" title={t("detail.tabs.cancellation")}>
            <ul className="space-y-2">{y.slabs.map((sl, i) => <li key={i} className="rounded-lg border border-border px-4 py-2.5">{sl.min_days > 0 ? t("detail.slab", { days: sl.min_days, p: sl.refund_percent }) : t("detail.slabLast", { days: y.slabs[i - 1]?.min_days ?? 15, p: sl.refund_percent })}</li>)}</ul>
          </Sec>
          <Sec id="faqs" title={t("detail.tabs.faqs")}>
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card">
              {y.yatra_faqs.map((f) => <AccordionItem key={f.id} value={f.id} className="px-4"><AccordionTrigger className="text-left text-base">{loc(f, "question", lang)}</AccordionTrigger><AccordionContent className="text-[16px]">{loc(f, "answer", lang)}</AccordionContent></AccordionItem>)}
            </Accordion>
          </Sec>
          <Sec id="reviews" title={t("detail.tabs.reviews")}>
            {y.reviews.length === 0 ? <p className="text-muted-foreground">{t("detail.noReviews")}</p> : <div className="grid gap-4 sm:grid-cols-2">{y.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4"><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="h-4 w-4 fill-gold text-gold" />)}</div><p className="mt-2">{r.comment}</p><p className="mt-2 text-sm font-semibold">{r.name}{r.city ? `, ${r.city}` : ""}</p></div>
            ))}</div>}
          </Sec>
          {y.map_embed_url && <Sec id="map" title={t("detail.tabs.map")}><iframe src={y.map_embed_url} title={t("detail.tabs.map")} loading="lazy" className="aspect-video w-full rounded-2xl border border-border" /></Sec>}

          {y.related.length > 0 && <section className="mt-12"><SectionHeading title={t("detail.related")} /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{y.related.map((r) => <YatraCard key={r.id} y={r} />)}</div></section>}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-warm">
              <div className="text-sm text-muted-foreground">{t("common.from")}</div>
              <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-maroon">{formatINR(y.price)}</span>{off > 0 && <span className="text-muted-foreground line-through">{formatINR(y.original_price)}</span>}</div>
              <div className="text-sm text-muted-foreground">{t("common.perPerson")}</div>
              {next && <div className="mt-4 rounded-xl bg-secondary p-3 text-sm"><div className="text-muted-foreground">{t("detail.bookingCard")}</div><div className="font-semibold">{formatDate(next.start_date, lang)} · {t("common.seatsLeftPlain", { count: seatsLeft(next) })}</div></div>}
              <Button asChild size="lg" className="mt-4 h-12 w-full rounded-full bg-maroon text-base text-maroon-foreground hover:bg-maroon/90"><a href="#departures">{t("common.bookNow")}</a></Button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="h-11"><a href={telHref(s.phone)}><Phone className="h-4 w-4" />{t("common.callNow")}</a></Button>
                <Button variant="outline" className="h-11" onClick={() => window.open(waHref("", `${title} ${window.location.href}`), "_blank", "noopener")}><Share2 className="h-4 w-4" />{t("common.share")}</Button>
              </div>
              <AskDialog yatraId={y.id} title={title} />
              {y.brochure_url && <Button asChild variant="link" className="mt-2 w-full"><a href={y.brochure_url} target="_blank" rel="noreferrer"><Download className="h-4 w-4" />{t("detail.brochure")}</a></Button>}
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-card p-3 pr-20 shadow-warm lg:hidden">
        <div className="min-w-0 flex-1"><div className="text-xs text-muted-foreground">{t("common.from")}</div><div className="text-xl font-bold text-maroon">{formatINR(y.price)}</div></div>
        <Button asChild size="lg" className="h-12 rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90"><a href="#departures">{t("common.bookNow")}</a></Button>
      </div>
    </div>
  );
}

function AskDialog({ yatraId, title }: { yatraId: string; title: string }) {
  const { t } = useTranslation();
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="secondary" className="mt-2 h-11 w-full"><MessageCircle className="h-4 w-4" />{t("detail.askQuestion")}</Button></DialogTrigger>
      <DialogContent><DialogTitle>{t("detail.askQuestion")}</DialogTitle><EnquiryForm source="trip" yatraId={yatraId} defaultYatra={title} compact withMessage /></DialogContent>
    </Dialog>
  );
}

function Sec({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-36 border-b border-border py-8"><h2 className="mb-4 font-display text-2xl text-maroon">{title}</h2>{children}</section>;
}
