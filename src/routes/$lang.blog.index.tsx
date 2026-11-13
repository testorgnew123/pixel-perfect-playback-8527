import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { blogQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { formatDate, loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError } from "@/components/site/ui";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/$lang/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(blogQuery),
  head: ({ params }) => pageMeta(params.lang, { hi: "तीर्थ यात्रा ब्लॉग", en: "Pilgrimage Blog & Guides" }, { hi: "चार धाम, अमरनाथ और अन्य यात्राओं के लिए गाइड और सुझाव।", en: "Guides and tips for Char Dham, Amarnath and other yatras." }),
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useSuspenseQuery(blogQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const cats = Array.from(new Set(data.map((b) => b.category).filter(Boolean))) as string[];
  const list = data.filter((b) => (!cat || b.category === cat) && (!q || `${b.title_en} ${b.title_hi}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageHero title={t("blog.title")} sub={t("blog.subtitle")} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("blog.search")} className="h-11 max-w-xs bg-card" />
          {["", ...cats].map((c) => <button key={c} onClick={() => setCat(c)} className={`h-11 rounded-full px-4 ${cat === c ? "bg-maroon text-maroon-foreground" : "bg-secondary"}`}>{c || t("blog.all")}</button>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <Link key={b.id} to="/$lang/blog/$slug" params={{ lang, slug: b.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img src={b.cover_image ?? ""} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="p-5"><div className="text-sm text-muted-foreground">{b.category} · {formatDate(b.published_at, lang)}</div><h2 className="mt-1 text-lg font-semibold group-hover:text-maroon">{loc(b, "title", lang)}</h2><p className="mt-2 line-clamp-2 text-muted-foreground">{loc(b, "excerpt", lang)}</p></div>
            </Link>
          ))}
        </div>
        {list.length === 0 && <p className="py-12 text-center text-muted-foreground">{t("common.noResults")}</p>}
      </div>
    </>
  );
}
