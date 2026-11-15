import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Menu, Phone, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLang, useSettings } from "@/lib/use-lang";
import { telHref } from "@/lib/format";
import { useSessionUser } from "@/lib/use-session";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/$lang", key: "home" },
  { to: "/$lang/yatras", key: "yatras" },
  { to: "/$lang/destinations", key: "destinations" },
  { to: "/$lang/departures", key: "departures" },
  { to: "/$lang/types", key: "types" },
  { to: "/$lang/blog", key: "blog" },
  { to: "/$lang/about", key: "about" },
  { to: "/$lang/gallery", key: "gallery" },
  { to: "/$lang/faq", key: "faq" },
  { to: "/$lang/contact", key: "contact" },
] as const;

export function LangToggle({ className = "" }: { className?: string }) {
  const lang = useLang();
  const { pathname, searchStr } = useLocation();
  const router = useRouter();
  const hrefFor = (next: Lang) => `/${next}${pathname.replace(/^\/(hi|en)(?=\/|$)/, "")}${searchStr}`;
  const go = (next: Lang) => {
    if (next === lang) return;
    try { window.localStorage.setItem("tdy_lang", next); } catch { /* ignore */ }
    void router.navigate({ href: hrefFor(next) });
  };
  return (
    // cn(), not a template literal: a caller passing `hidden` was losing to the base
    // `inline-flex` (same specificity, stylesheet order wins), so the toggle rendered on phones.
    <div className={cn("inline-flex items-center rounded-full border border-border bg-card p-0.5 text-sm", className)} role="group" aria-label="Language">
      {/* Real <a href> values, not buttons: these are the only links between the /hi and /en
          trees, so without a crawlable href a crawler has no path into the other language. */}
      <a href={hrefFor("hi")} onClick={(e) => { e.preventDefault(); go("hi"); }} className={`rounded-full px-3 py-1.5 font-hindi ${lang === "hi" ? "bg-maroon text-maroon-foreground" : "text-foreground"}`} hrefLang="hi" aria-current={lang === "hi" ? "true" : undefined}>हिंदी</a>
      <a href={hrefFor("en")} onClick={(e) => { e.preventDefault(); go("en"); }} className={`rounded-full px-3 py-1.5 ${lang === "en" ? "bg-maroon text-maroon-foreground" : "text-foreground"}`} hrefLang="en" aria-current={lang === "en" ? "true" : undefined}>English</a>
    </div>
  );
}

export function Header() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const { user } = useSessionUser();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:h-20 min-[1900px]:max-w-[1880px]">
        {/* min-w-0 + truncate: without them the nowrap brand forced a 501px header row that
            could not shrink, pushing the menu button off-screen on every phone width. */}
        <Link to="/$lang" params={{ lang }} className="flex min-w-0 items-center gap-2">
          <img src="/images/logo.png" alt="" width={327} height={160} className="h-10 w-auto shrink-0 mix-blend-multiply lg:h-12" aria-hidden />
          <span className="line-clamp-2 font-display text-xl leading-tight text-maroon lg:text-2xl min-[1900px]:whitespace-nowrap">{s.brand}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 min-[1900px]:flex">
          {NAV.map((n) => (
            <Link key={n.key} to={n.to} params={{ lang }} activeOptions={{ exact: n.key === "home" }} className="whitespace-nowrap rounded-md px-2.5 py-2 text-[15px] min-[1900px]:px-2 font-medium text-foreground hover:text-maroon data-[status=active]:text-maroon data-[status=active]:underline underline-offset-8 decoration-saffron decoration-2">
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link to="/$lang/yatras" params={{ lang }} aria-label={t("nav.search")} className="hidden h-10 w-10 place-items-center rounded-full hover:bg-muted sm:grid">
            <Search className="h-5 w-5" />
          </Link>
          <LangToggle className="hidden md:inline-flex" />
          {user?.isAgent && <Button asChild variant="ghost" className="hidden lg:inline-flex"><Link to="/$lang/agent" params={{ lang }}>{t("nav.agentPortal")}</Link></Button>}
          <Button asChild variant="ghost" className="hidden lg:inline-flex">{user ? <Link to="/$lang/account" params={{ lang }}>{t("auth.myAccount")}</Link> : <Link to="/$lang/login" params={{ lang }} search={{ redirect: undefined }}>{t("nav.login")}</Link>}</Button>
          <Button asChild className="hidden sm:inline-flex rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90 shadow-warm">
            <Link to="/$lang/departures" params={{ lang }}>{t("nav.bookNow")}</Link>
          </Button>
          <a href={telHref(s.phone)} className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-maroon sm:hidden" aria-label={t("common.callNow")}><Phone className="h-5 w-5" /></a>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted min-[1900px]:hidden" aria-label={t("nav.menu")}><Menu className="h-6 w-6" /></button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto bg-background p-0">
              <div className="flex items-center justify-between border-b border-border p-4">
                <SheetTitle className="font-display text-xl text-maroon">{s.brand}</SheetTitle>
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-4"><LangToggle /></div>
              <nav className="flex flex-col px-2 pb-4">
                {NAV.map((n) => (
                  <Link key={n.key} to={n.to} params={{ lang }} onClick={() => setOpen(false)} activeOptions={{ exact: n.key === "home" }} className="rounded-lg px-4 py-3.5 text-lg font-medium hover:bg-muted data-[status=active]:bg-secondary data-[status=active]:text-maroon">
                    {t(`nav.${n.key}`)}
                  </Link>
                ))}
                {user?.isAgent && <Link to="/$lang/agent" params={{ lang }} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3.5 text-lg font-medium hover:bg-muted">{t("nav.agentPortal")}</Link>}
                {user ? <Link to="/$lang/account" params={{ lang }} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3.5 text-lg font-medium hover:bg-muted">{t("auth.myAccount")}</Link> : <Link to="/$lang/login" params={{ lang }} search={{ redirect: undefined }} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3.5 text-lg font-medium hover:bg-muted">{t("nav.login")}</Link>}
              </nav>
              <div className="border-t border-border p-4">
                <Button asChild size="lg" className="w-full rounded-full bg-maroon text-maroon-foreground hover:bg-maroon/90">
                  <Link to="/$lang/departures" params={{ lang }} onClick={() => setOpen(false)}>{t("nav.bookNow")}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
