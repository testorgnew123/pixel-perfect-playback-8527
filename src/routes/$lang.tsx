import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { useMemo } from "react";
import { getI18n, isLang } from "@/lib/i18n";
import { footerQuery, settingsQuery } from "@/lib/queries";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingButtons } from "@/components/site/FloatingButtons";
import { RouteError, RouteNotFound } from "@/components/site/ui";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(settingsQuery), context.queryClient.ensureQueryData(footerQuery)]);
  },
  head: ({ params }) => ({
    links: [
      { rel: "alternate", hrefLang: "hi", href: `/hi` },
      { rel: "alternate", hrefLang: "en", href: `/en` },
    ],
    meta: [{ property: "og:locale", content: params.lang === "en" ? "en_IN" : "hi_IN" }],
  }),
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
