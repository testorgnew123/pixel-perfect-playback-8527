import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { useMemo } from "react";
import { getI18n, isLang } from "@/lib/i18n";
import { footerQuery, settingsQuery } from "@/lib/queries";
import { SITE_URL, absUrl, cleanPath, ldScript, pathForLang, toLang } from "@/lib/seo";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";
import { RouteError, RouteNotFound } from "@/components/site/ui";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: async ({ context }) => {
    // Returns the settings so head() can build the sitewide Organization JSON-LD from the
    // same cached row the components render from.
    const [settings] = await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(footerQuery),
    ]);
    return { settings };
  },
  // Canonical, og:url and hreflang are emitted once here rather than in all 22 routes:
  // the deepest match's pathname is the current page's path, and it carries no search
  // params, so the 11-param faceted /yatras URLs canonicalise to the bare listing for free.
  head: ({ params, matches, loaderData }) => {
    const lang = toLang(params.lang);
    const path = cleanPath(matches[matches.length - 1]?.pathname ?? `/${lang}`);
    const canonical = absUrl(path);
    const s = loaderData?.settings;
    const org = s
      ? ldScript({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "@id": `${SITE_URL}/#organization`,
          name: lang === "hi" ? s.brand_name_hi || s.brand_name_en : s.brand_name_en,
          url: SITE_URL,
          ...(s.logo_url ? { logo: absUrl(s.logo_url) } : {}),
          ...(s.phone ? { telephone: s.phone } : {}),
          ...(s.email ? { email: s.email } : {}),
          ...(s.address_en || s.address_hi
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: lang === "hi" ? s.address_hi || s.address_en : s.address_en,
                  addressCountry: "IN",
                },
              }
            : {}),
          ...(s.gst_number ? { taxID: s.gst_number } : {}),
          ...(() => {
            const social = Object.values((s.social ?? {}) as Record<string, string>).filter(Boolean);
            return social.length ? { sameAs: social } : {};
          })(),
        })
      : null;
    return {
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hrefLang: "hi", href: absUrl(pathForLang(path, "hi")) },
        { rel: "alternate", hrefLang: "en", href: absUrl(pathForLang(path, "en")) },
        // Hindi is what / redirects to, so it is the default for unmatched locales.
        { rel: "alternate", hrefLang: "x-default", href: absUrl(pathForLang(path, "hi")) },
      ],
      meta: [
        { property: "og:locale", content: lang === "en" ? "en_IN" : "hi_IN" },
        { property: "og:url", content: canonical },
      ],
      scripts: org ? [org] : [],
    };
  },
  component: LangLayout,
  errorComponent: ({ error }) => <RouteError error={error} />,
  notFoundComponent: () => <RouteNotFound />,
});

function LangLayout() {
  const { lang } = Route.useParams();
  const i18n = useMemo(() => getI18n(isLang(lang) ? lang : "hi"), [lang]);
  return (
    <I18nextProvider i18n={i18n}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1"><Outlet /></main>
        <Footer />
        <FloatingButtons />
      </div>
    </I18nextProvider>
  );
}
