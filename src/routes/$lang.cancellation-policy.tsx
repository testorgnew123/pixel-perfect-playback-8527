import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/$lang/cancellation-policy")({
  head: ({ params }) => pageMeta(params.lang, { hi: "रद्दीकरण एवं रिफंड नीति", en: "Cancellation & Refund Policy" }, { hi: "रद्दीकरण एवं रिफंड नीति – तीर्थ दर्शन यात्रा", en: "Cancellation & Refund Policy of Tirth Darshan Yatra" }),
  component: () => <LegalPage doc="cancellation" />,
});
