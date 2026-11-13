import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/$lang/terms")({
  head: ({ params }) => pageMeta(params.lang, { hi: "नियम एवं शर्तें", en: "Terms & Conditions" }, { hi: "नियम एवं शर्तें – हरि शिव शंकर तीर्थ यात्रा", en: "Terms & Conditions of Hari Shiv Shankar Tirth Yatra" }),
  component: () => <LegalPage doc="terms" />,
});
