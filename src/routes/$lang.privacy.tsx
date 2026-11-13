import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/$lang/privacy")({
  head: ({ params }) => pageMeta(params.lang, { hi: "गोपनीयता नीति", en: "Privacy Policy" }, { hi: "गोपनीयता नीति – हरि शिव शंकर तीर्थ यात्रा", en: "Privacy Policy of Hari Shiv Shankar Tirth Yatra" }),
  component: () => <LegalPage doc="privacy" />,
});
