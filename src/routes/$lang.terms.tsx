import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/$lang/terms")({
  head: ({ params }) => pageMeta(params.lang, { hi: "नियम एवं शर्तें", en: "Terms & Conditions" }, { hi: "नियम एवं शर्तें – तीर्थ दर्शन यात्रा", en: "Terms & Conditions of Tirth Darshan Yatra" }),
  component: () => <LegalPage doc="terms" />,
});
