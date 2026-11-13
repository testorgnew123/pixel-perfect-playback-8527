import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/$lang/privacy")({
  head: ({ params }) => pageMeta(params.lang, { hi: "गोपनीयता नीति", en: "Privacy Policy" }, { hi: "गोपनीयता नीति – तीर्थ दर्शन यात्रा", en: "Privacy Policy of Tirth Darshan Yatra" }),
  component: () => <LegalPage doc="privacy" />,
});
