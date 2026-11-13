import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { galleryQuery } from "@/lib/queries";
import { useLang } from "@/lib/use-lang";
import { loc } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero, RouteError } from "@/components/site/ui";

export const Route = createFileRoute("/$lang/gallery")({
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
  head: ({ params }) => pageMeta(params.lang, { hi: "यात्रा गैलरी", en: "Yatra Gallery" }, { hi: "हमारी तीर्थ यात्राओं की तस्वीरें।", en: "Photos from our pilgrimage tours." }),
  component: Page,
  errorComponent: ({ error }) => <RouteError error={error} />,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useSuspenseQuery(galleryQuery);
  const [open, setOpen] = useState<number | null>(null);
  const cur = open != null ? data[open] : null;
  return (
    <>
      <PageHero title={t("gallery.title")} sub={t("gallery.subtitle")} />
      <div className="mx-auto max-w-7xl columns-1 gap-4 px-4 py-10 sm:columns-2 lg:columns-3">
        {data.map((g, i) => (
          <button key={g.id} onClick={() => setOpen(i)} className="mb-4 block w-full overflow-hidden rounded-2xl">
            <img src={g.url} alt={loc(g, "caption", lang)} loading="lazy" className={`w-full object-cover transition hover:scale-105 ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"}`} />
          </button>
        ))}
      </div>
      <Dialog open={open != null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="px-2 pt-2">{cur ? loc(cur, "caption", lang) : ""}</DialogTitle>
          {cur && <img src={cur.url} alt={loc(cur, "caption", lang)} className="max-h-[80vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
