import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqsQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(faqsQuery),
  head: ({ params, loaderData }) => ({
    ...pageMeta(params.lang, { hi: "सामान्य प्रश्न", en: "Frequently Asked Questions" }, { hi: "बुकिंग, यात्रा, भोजन और रद्दीकरण से जुड़े प्रश्नों के उत्तर।", en: "Answers about booking, travel, food and cancellations." }),
    scripts: loaderData ? [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: loaderData.map((f) => ({ "@type": "Question", name: f.question_en, acceptedAnswer: { "@type": "Answer", text: f.answer_en } })) }) }] : [],
  }),
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useSuspenseQuery(faqsQuery);
  const groups = Array.from(new Set(data.map((f) => loc(f, "group", lang))));
  return (
    <>
      <PageHero title={t("faq.title")} sub={t("faq.subtitle")} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {groups.map((g) => (
          <section key={g} className="mb-8"><h2 className="mb-3 font-display text-2xl text-maroon">{g}</h2>
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card">
              {data.filter((f) => loc(f, "group", lang) === g).map((f) => <AccordionItem key={f.id} value={f.id} className="px-4"><AccordionTrigger className="text-left text-base">{loc(f, "question", lang)}</AccordionTrigger><AccordionContent className="text-[16px]">{loc(f, "answer", lang)}</AccordionContent></AccordionItem>)}
            </Accordion>
          </section>
        ))}
      </div>
    </>
  );
}
