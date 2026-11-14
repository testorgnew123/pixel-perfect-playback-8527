import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { BadgeCheck, Bus, Castle, ChevronRight, Clock4, Flame, Flower, Hand, HeartHandshake, Landmark, MessageCircle, Mountain, MountainSnow, Phone, Plane, Search, ShieldCheck, Sparkles, Star, Sun, UtensilsCrossed, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { homeQuery } from "@/lib/queries";
import { useLang, useSettings } from "@/lib/use-lang";
import { formatDate, loc, telHref, waHref } from "@/lib/format";
import { BRAND, SITE_URL, ldScript, pageMeta } from "@/lib/seo";
import { Counter, DepartureCard, Reveal, RouteError, SectionHeading, YatraCard } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { imgSources } from "@/lib/img";

// Explicit map, not a namespace import: `import * as Icons from "lucide-react"` defeats
// tree-shaking and pulled the whole icon library (~580 KB raw) into this route's chunk.
// Keys are the `categories.icon` values seeded in drizzle/migrations/0001_seed_sample_data.sql;
// anything else an admin types falls back to Sparkles.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  castle: Castle,
  flame: Flame,
  flower: Flower,
  hand: Hand,
  "heart-handshake": HeartHandshake,
  landmark: Landmark,
  mountain: Mountain,
  "mountain-snow": MountainSnow,
  plane: Plane,
  sparkles: Sparkles,
  sun: Sun,
  users: Users,
};

export const Route = createFileRoute("/$lang/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: ({ params }) => ({
    ...pageMeta(params.lang,
      { hi: "चार धाम, ज्योतिर्लिंग एवं तीर्थ यात्रा पैकेज", en: "Char Dham, Jyotirlinga & Pilgrimage Tour Packages" },
      { hi: "चार धाम, 12 ज्योतिर्लिंग, काशी, अयोध्या और दक्षिण भारत की सामूहिक तीर्थ यात्राएँ। शुद्ध शाकाहारी भोजन, अनुभवी टूर मैनेजर, ऑनलाइन बुकिंग।", en: "Group pilgrimages to Char Dham, 12 Jyotirlingas, Kashi, Ayodhya and South India. Pure-veg meals, experienced tour managers, live seats and online booking." }),
    // WebSite + SearchAction: the hero already posts a real keyword search to /yatras?q=,
    // so the query template describes a search the site genuinely supports.
    scripts: [
      ldScript({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: BRAND.en,
        alternateName: BRAND.hi,
        inLanguage: params.lang === "en" ? "en-IN" : "hi-IN",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/${params.lang === "en" ? "en" : "hi"}/yatras?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      }),
    ],
  }),
  component: Home,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Hero() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { data } = useSuspenseQuery(homeQuery);
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const slides = data.banners;
  const months = t("months", { returnObjects: true }) as string[];
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % Math.max(1, slides.length)), 6000); return () => clearInterval(id); }, [slides.length]);

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    void navigate({ to: "/$lang/yatras", params: { lang }, search: { q: f["q"] || undefined, month: f["month"] ? Number(f["month"]) : undefined, budget: f["budget"] ? Number(f["budget"]) : undefined } });
  }

  return (
    <section className="relative min-h-[620px] overflow-hidden md:min-h-[680px]">
      {slides.map((b, idx) => (
        // Slide 0 is the LCP element: eager + fetchPriority high. Later slides sit inside the
        // viewport at opacity-0, so loading="lazy" never actually defers them.
        <img key={b.id} {...imgSources(b.image_url, "100vw")} alt={loc(b, "subtitle", lang)} decoding="async" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`} {...(idx === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })} />
      ))}
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-4 py-16 text-maroon-foreground md:min-h-[680px]">
        <p className="mb-3 inline-flex w-fit rounded-full bg-gold/90 px-4 py-1 text-sm font-semibold text-maroon">{slides[i] ? loc(slides[i], "subtitle", lang) : ""}</p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">{t("home.heroTitle")}</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-13 rounded-full px-7 text-base"><Link to="/$lang/yatras" params={{ lang }}>{t("home.viewYatras")} <ChevronRight className="h-5 w-5" /></Link></Button>
          <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-maroon-foreground/70 bg-transparent px-7 text-base text-maroon-foreground hover:bg-maroon-foreground/10 hover:text-maroon-foreground"><a href={telHref(s.phone)}><Phone className="h-5 w-5" /> {t("common.callNow")}</a></Button>
        </div>
        <form onSubmit={onSearch} className="mt-10 grid gap-2 rounded-2xl bg-card p-3 text-foreground shadow-warm md:grid-cols-[2fr_1fr_1fr_auto]">
          <input name="q" placeholder={t("home.searchDest")} aria-label={t("home.searchDest")} className="h-13 rounded-xl border border-input bg-background px-4 text-base" />
          <select name="month" aria-label={t("home.searchMonth")} className="h-13 rounded-xl border border-input bg-background px-3 text-base" defaultValue="">
            <option value="">{t("home.anyMonth")}</option>
            {months.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
          </select>
          <select name="budget" aria-label={t("home.searchBudget")} className="h-13 rounded-xl border border-input bg-background px-3 text-base" defaultValue="">
            <option value="">{t("home.anyBudget")}</option>
            <option value="15000">{t("budget.u15")}</option>
            <option value="30000">{t("budget.15_30")}</option>
            <option value="60000">{t("budget.30_60")}</option>
            <option value="300000">{t("budget.60p")}</option>
          </select>
          <Button type="submit" size="lg" className="h-13 rounded-xl bg-maroon px-6 text-base text-maroon-foreground hover:bg-maroon/90"><Search className="h-5 w-5" /> {t("home.searchBtn")}</Button>
        </form>
        <div className="mt-6 flex gap-2">
          {/* The dot stays 10px; before:-inset-y-4 gives it a ~44px tall tap area. */}
          {slides.map((b, idx) => <button key={b.id} onClick={() => setI(idx)} aria-label={t("common.goToSlide", { n: idx + 1 })} aria-current={idx === i ? "true" : undefined} className={`relative h-2.5 rounded-full transition-all before:absolute before:-inset-y-4 before:-inset-x-1 before:content-[''] ${idx === i ? "w-8 bg-gold" : "w-2.5 bg-maroon-foreground/60"}`} />)}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { data } = useSuspenseQuery(homeQuery);
  const counters = (s.counters ?? {}) as Record<string, number>;
  const trust = [
    [Users, "guides"], [UtensilsCrossed, "veg"], [Bus, "transport"], [HeartHandshake, "senior"], [Clock4, "manager"], [BadgeCheck, "gst"],
  ] as const;
  const activities = [["spiritual", "/images/vrindavan.jpg"], ["trekking", "/images/himalaya.jpg"], ["heli", "/images/kedarnath.jpg"], ["aarti", "/images/varanasi.jpg"], ["rafting", "/images/himalaya.jpg"], ["snow", "/images/kedarnath.jpg"]] as const;
  const whyPoints = t("home.whyPoints", { returnObjects: true }) as string[];
  const iconFor = (name: string | null) => CATEGORY_ICONS[name ?? ""] ?? Sparkles;

  return (
    <>
      <Hero />

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-3 lg:grid-cols-6">
          {trust.map(([Icon, k]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-maroon"><Icon className="h-5 w-5" /></span>
              <span className="text-[15px] font-medium leading-tight">{t(`home.trust.${k}`)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeading title={t("home.upcoming")} sub={t("home.upcomingSub")} action={<Link to="/$lang/departures" params={{ lang }} className="font-semibold text-maroon hover:underline">{t("common.viewAll")} →</Link>} />
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
          {data.departures.map((d) => <DepartureCard key={d.id} d={d} />)}
        </div>
      </section>

      <section className="bg-mandala py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading title={t("home.popular")} sub={t("home.popularSub")} action={<Link to="/$lang/yatras" params={{ lang }} className="font-semibold text-maroon hover:underline">{t("common.viewAll")} →</Link>} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.featured.map((y) => <Reveal key={y.id}><YatraCard y={y} /></Reveal>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeading title={t("home.types")} sub={t("home.typesSub")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.categories.map((c) => {
            const Icon = iconFor(c.icon);
            return (
              <Link key={c.id} to="/$lang/types/$slug" params={{ lang, slug: c.slug }} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-primary">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-saffron text-maroon"><Icon className="h-7 w-7" /></span>
                <span className="text-[15px] font-semibold leading-tight">{loc(c, "name", lang)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-secondary py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading title={t("home.destinations")} sub={t("home.destinationsSub")} action={<Link to="/$lang/destinations" params={{ lang }} className="font-semibold text-maroon hover:underline">{t("common.viewAll")} →</Link>} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.destinations.map((d, idx) => (
              <Link key={d.id} to="/$lang/destinations/$slug" params={{ lang, slug: d.slug }} className={`group relative overflow-hidden rounded-2xl ${idx === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                <img {...imgSources(d.image_url, "(min-width: 1024px) 25vw, 50vw")} alt={loc(d, "name", lang)} loading="lazy" decoding="async" className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-hero-overlay" />
                <div className="absolute bottom-3 left-3 text-maroon-foreground">
                  <div className="text-lg font-semibold">{loc(d, "name", lang)}</div>
                  <div className="text-sm opacity-85">{d.state}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {data.offers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeading title={t("home.offers")} sub={t("home.offersSub")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.offers.map((y) => <YatraCard key={y.id} y={y} showCountdown />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <SectionHeading title={t("home.activities")} sub={t("home.activitiesSub")} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {activities.map(([k, img]) => (
            <div key={k} className="relative overflow-hidden rounded-2xl">
              <img src={img} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
              <div className="absolute inset-0 bg-hero-overlay" />
              <div className="absolute bottom-3 left-3 right-3 font-semibold text-maroon-foreground">{t(`home.act.${k}`)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-maroon py-16 text-maroon-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl text-gold md:text-4xl">{t("home.why")}</h2>
            <p className="mt-1 opacity-90">{t("home.whySub")}</p>
            <ul className="mt-6 space-y-3">
              {whyPoints.map((p) => <li key={p} className="flex gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-gold" /><span>{p}</span></li>)}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <Counter value={counters["yatras"] ?? 500} label={t("home.counters.yatras")} />
            <Counter value={counters["places"] ?? 150} label={t("home.counters.places")} />
            <Counter value={counters["years"] ?? 15} label={t("home.counters.years")} />
            <Counter value={counters["yatris"] ?? 25000} label={t("home.counters.yatris")} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeading title={t("home.testimonials")} />
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
          {data.testimonials.map((r) => (
            <figure key={r.id} className="w-80 shrink-0 snap-start rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="h-4 w-4 fill-gold text-gold" />)}</div>
              <blockquote className="mt-3 text-[15px]">“{loc(r, "quote", lang)}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-saffron font-semibold text-maroon">{r.name[0]}</span>
                <span><span className="block font-semibold">{r.name}</span><span className="text-sm text-muted-foreground">{loc(r, "city", lang)} · {loc(r, "yatra", lang)}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {s.video_url && (
        <section className="bg-secondary py-14">
          <div className="mx-auto max-w-4xl px-4">
            <SectionHeading title={t("home.video")} />
            <div className="aspect-video overflow-hidden rounded-2xl shadow-warm">
              <iframe src={s.video_url} title={t("home.video")} className="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeading title={t("home.reps")} sub={t("home.repsSub")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.reps.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-sm font-semibold text-maroon">{loc(r, "region", lang)}</div>
              <div className="mt-1 text-lg font-semibold">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.city}</div>
              <div className="mt-4 flex gap-2">
                <a href={telHref(r.phone)} className="grid h-11 flex-1 place-items-center rounded-full bg-secondary text-maroon" aria-label={t("common.callNow")}><Phone className="h-5 w-5" /></a>
                <a href={waHref(r.whatsapp, t("whatsappMsg"))} target="_blank" rel="noreferrer" className="grid h-11 flex-1 place-items-center rounded-full bg-whatsapp text-success-foreground" aria-label={t("common.whatsapp")}><MessageCircle className="h-5 w-5" /></a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <SectionHeading title={t("home.blog")} action={<Link to="/$lang/blog" params={{ lang }} className="font-semibold text-maroon hover:underline">{t("common.viewAll")} →</Link>} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.blog.map((b) => (
            <Link key={b.id} to="/$lang/blog/$slug" params={{ lang, slug: b.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img src={b.cover_image ?? ""} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover transition group-hover:scale-105" />
              <div className="p-5">
                <div className="text-sm text-muted-foreground">{formatDate(b.published_at, lang)}</div>
                <h3 className="mt-1 text-lg font-semibold group-hover:text-maroon">{loc(b, "title", lang)}</h3>
                <p className="mt-2 line-clamp-2 text-[15px] text-muted-foreground">{loc(b, "excerpt", lang)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-mandala py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-3xl text-maroon">{t("home.enquiryTitle")}</h2>
          <p className="mb-5 text-muted-foreground">{t("home.enquirySub")}</p>
          <EnquiryForm source="home" />
        </div>
      </section>
    </>
  );
}
