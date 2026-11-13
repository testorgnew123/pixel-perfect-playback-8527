import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Clock, Heart, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/use-lang";
import { departureStatus, discountPercent, formatDate, formatINR, loc, seatsLeft } from "@/lib/format";

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-3xl text-maroon md:text-4xl">{title}</h2>
        {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
        <div className="mt-3 h-1 w-20 rounded-full bg-gradient-saffron" />
      </div>
      {action}
    </div>
  );
}

export function PageHero({ title, sub, image }: { title: string; sub?: string; image?: string | null }) {
  return (
    <section className="relative overflow-hidden">
      {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className={`relative ${image ? "bg-hero-overlay text-maroon-foreground" : "bg-mandala"} `}>
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <h1 className={`font-display text-4xl md:text-5xl ${image ? "" : "text-maroon"}`}>{title}</h1>
          {sub && <p className="mt-3 max-w-2xl text-lg opacity-90">{sub}</p>}
        </div>
      </div>
    </section>
  );
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`${shown ? "animate-fade-up" : "opacity-0"} ${className}`}>{children}</div>;
}

export function Counter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1600);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl text-gold md:text-5xl">{n.toLocaleString("en-IN")}+</div>
      <div className="mt-1 text-maroon-foreground/90">{label}</div>
    </div>
  );
}

export function Countdown({ to }: { to: string }) {
  const { t } = useTranslation();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  if (now == null) return <span className="text-sm">&nbsp;</span>;
  const diff = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{t("common.offerEndsIn")}:</span>
      {[[d, "d"], [h, "h"], [m, "m"], [s, "s"]].map(([v, k]) => (
        <span key={k as string} className="rounded bg-maroon px-1.5 py-0.5 font-semibold tabular-nums text-maroon-foreground">{String(v).padStart(2, "0")}{t(`common.${k}`)}</span>
      ))}
    </div>
  );
}

type CardYatra = {
  slug: string; title_en: string; title_hi: string | null; duration_days: number; duration_nights: number;
  price: number | null; original_price: number | null; rating: number; review_count: number; cover_image: string | null;
  starting_city_en?: string | null; starting_city_hi?: string | null; offer?: boolean; offer_ends_at?: string | null;
};

export function YatraCard({ y, showCountdown = false, nextDate }: { y: CardYatra; showCountdown?: boolean; nextDate?: string | null }) {
  const { t } = useTranslation();
  const lang = useLang();
  const off = discountPercent(y.original_price, y.price);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-warm">
      <Link to="/$lang/yatras/$slug" params={{ lang, slug: y.slug }} className="relative block aspect-[4/3] overflow-hidden">
        <img src={y.cover_image ?? "/images/kedarnath.jpg"} alt={loc(y, "title", lang)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {off > 0 && <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">{t("common.off", { p: off })}</Badge>}
        <button type="button" aria-label={t("common.wishlist")} onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-maroon"><Heart className="h-4 w-4" /></button>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{t("common.daysNights", { d: y.duration_days, n: y.duration_nights })}</span>
          <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" />{Number(y.rating).toFixed(1)}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug">
          <Link to="/$lang/yatras/$slug" params={{ lang, slug: y.slug }} className="hover:text-maroon">{loc(y, "title", lang)}</Link>
        </h3>
        {y.starting_city_en && <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{t("common.startingCity")}: {loc(y, "starting_city", lang)}</p>}
        {nextDate && <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{formatDate(nextDate, lang)}</p>}
        {showCountdown && y.offer_ends_at && <div className="mt-2"><Countdown to={y.offer_ends_at} /></div>}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <div className="text-xs text-muted-foreground">{t("common.from")}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-maroon">{formatINR(y.price)}</span>
              {off > 0 && <span className="text-sm text-muted-foreground line-through">{formatINR(y.original_price)}</span>}
            </div>
            <div className="text-xs text-muted-foreground">{t("common.perPerson")}</div>
          </div>
          <Button asChild size="sm" className="rounded-full"><Link to="/$lang/yatras/$slug" params={{ lang, slug: y.slug }}>{t("common.viewDetails")}</Link></Button>
        </div>
      </div>
    </article>
  );
}

export function DepartureCard({ d }: { d: { id: string; start_date: string; total_seats: number; booked_seats: number; status: string; price_override: number | null; yatra: CardYatra } }) {
  const { t } = useTranslation();
  const lang = useLang();
  const left = seatsLeft(d);
  const st = departureStatus(d);
  return (
    <article className="flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative h-36">
        <img src={d.yatra.cover_image ?? ""} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute bottom-2 left-2 rounded-lg bg-card/95 px-2.5 py-1 text-sm font-semibold text-maroon">{formatDate(d.start_date, lang)}</div>
        {left < 10 && st !== "sold_out" && <Badge className="absolute right-2 top-2 bg-destructive text-destructive-foreground">{t("common.seatsLeft", { count: left })}</Badge>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug">{loc(d.yatra, "title", lang)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("common.daysNights", { d: d.yatra.duration_days, n: d.yatra.duration_nights })}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div><span className="text-xs text-muted-foreground">{t("common.from")} </span><span className="text-lg font-bold text-maroon">{formatINR(d.price_override ?? d.yatra.price)}</span></div>
          <Button asChild size="sm" className="rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90">
            <Link to="/$lang/yatras/$slug" params={{ lang, slug: d.yatra.slug }} hash="departures">{t("common.bookNow")}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const cls = status === "available" ? "bg-success text-success-foreground" : status === "filling_fast" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground";
  return <Badge className={cls}>{t(`status.${status}`)}</Badge>;
}

export function RouteError({ error }: { error: unknown }) {
  return <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-destructive">{error instanceof Error ? error.message : String(error)}</div>;
}
export function RouteNotFound() {
  const { t } = useTranslation();
  const lang = useLang();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-maroon">{t("notFound.title")}</h1>
      <Button asChild className="mt-6 rounded-full"><Link to="/$lang" params={{ lang }}>{t("notFound.home")}</Link></Button>
    </div>
  );
}
