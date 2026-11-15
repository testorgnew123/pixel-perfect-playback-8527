import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { footerQuery } from "@/lib/queries";
import { useLang, useSettings } from "@/lib/use-lang";
import { loc, telHref } from "@/lib/format";

export function Footer() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { data: popular } = useSuspenseQuery(footerQuery);
  const social = (s.social ?? {}) as Record<string, string>;
  const links = [
    ["/$lang/yatras", "yatras"], ["/$lang/departures", "departures"], ["/$lang/destinations", "destinations"], ["/$lang/blog", "blog"],
    ["/$lang/about", "about"], ["/$lang/team", "team"], ["/$lang/gallery", "gallery"], ["/$lang/faq", "faq"], ["/$lang/contact", "contact"],
  ] as const;

  return (
    <footer className="mt-16 bg-gradient-maroon text-maroon-foreground">
      <div className="divider-arch" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/images/logo.png" alt="" width={327} height={160} loading="lazy" className="mb-3 h-16 w-auto rounded-lg bg-white p-1.5" aria-hidden />
          <div className="font-display text-2xl text-gold">{s.brand}</div>
          <p className="mt-3 text-[15px] opacity-90">{loc(s, "about", lang).slice(0, 180)}…</p>
          <div className="mt-4 flex gap-3">
            {social["facebook"] && <a href={social["facebook"]} aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full bg-maroon-foreground/10 hover:bg-maroon-foreground/20"><Facebook className="h-5 w-5" /></a>}
            {social["instagram"] && <a href={social["instagram"]} aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-maroon-foreground/10 hover:bg-maroon-foreground/20"><Instagram className="h-5 w-5" /></a>}
            {social["youtube"] && <a href={social["youtube"]} aria-label="YouTube" className="grid h-10 w-10 place-items-center rounded-full bg-maroon-foreground/10 hover:bg-maroon-foreground/20"><Youtube className="h-5 w-5" /></a>}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gold">{t("footer.quick")}</h3>
          <ul className="grid grid-cols-2 gap-y-2 text-[15px] sm:grid-cols-1">
            {links.map(([to, k]) => <li key={k}><Link to={to} params={{ lang }} className="opacity-90 hover:opacity-100 hover:underline">{t(`nav.${k}`)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gold">{t("footer.popular")}</h3>
          <ul className="space-y-2 text-[15px]">
            {popular.map((y) => <li key={y.slug}><Link to="/$lang/yatras/$slug" params={{ lang, slug: y.slug }} className="opacity-90 hover:underline">{loc(y, "title", lang)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gold">{t("footer.contact")}</h3>
          <ul className="space-y-3 text-[15px]">
            <li className="flex gap-2"><Phone className="mt-1 h-4 w-4 shrink-0" /><a href={telHref(s.phone)}>{s.phone}</a></li>
            <li className="flex gap-2"><Mail className="mt-1 h-4 w-4 shrink-0" /><a href={`mailto:${s.email}`}>{s.email}</a></li>
            <li className="flex gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" /><span>{loc(s, "address", lang)}</span></li>
          </ul>
          <div className="mt-5 text-sm">
            <div className="mb-2 font-semibold text-gold">{t("footer.pay")}</div>
            <div className="flex flex-wrap gap-2">
              {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"].map((p) => <span key={p} className="rounded-md bg-maroon-foreground/10 px-2 py-1 text-xs">{p}</span>)}
            </div>
            {s.gst_number && <div className="mt-3 text-xs opacity-80">{t("footer.gst")}: {s.gst_number}</div>}
          </div>
        </div>
      </div>
      <div className="border-t border-maroon-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm opacity-85 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {s.brand}. {t("footer.rights")}</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/$lang/privacy" params={{ lang }} className="hover:underline">{t("footer.privacy")}</Link>
            <Link to="/$lang/terms" params={{ lang }} className="hover:underline">{t("footer.terms")}</Link>
            <Link to="/$lang/cancellation-policy" params={{ lang }} className="hover:underline">{t("footer.cancellation")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
