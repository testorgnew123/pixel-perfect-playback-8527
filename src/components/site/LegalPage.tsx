import { LEGAL } from "@/content/legal";
import { useLang } from "@/lib/use-lang";
import { PageHero } from "./ui";

export function LegalPage({ doc }: { doc: keyof typeof LEGAL }) {
  const lang = useLang();
  const d = LEGAL[doc][lang];
  return (
    <>
      <PageHero title={d.title} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        {d.sections.map(([h, p]) => <section key={h}><h2 className="text-xl font-semibold text-maroon">{h}</h2><p className="mt-1 text-[17px]">{p}</p></section>)}
      </div>
    </>
  );
}
