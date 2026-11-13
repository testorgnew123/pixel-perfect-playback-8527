import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/$lang/cancellation-policy")({
  head: ({ params }) => pageMeta(params.lang, { hi: "रद्दीकरण एवं रिफंड नीति", en: "Cancellation & Refund Policy" }, { hi: "रद्दीकरण एवं रिफंड नीति – हरि शिव शंकर तीर्थ यात्रा", en: "Cancellation & Refund Policy of Hari Shiv Shankar Tirth Yatra" }),
  component: () => <LegalPage doc="cancellation" />,
});
