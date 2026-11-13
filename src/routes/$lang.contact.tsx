import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useLang, useSettings } from "@/lib/use-lang";
import { loc, telHref, waHref } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/site/ui";
import { EnquiryForm } from "@/components/site/EnquiryForm";

export const Route = createFileRoute("/$lang/contact")({
  head: ({ params }) => pageMeta(params.lang, { hi: "संपर्क करें", en: "Contact Us" }, { hi: "फ़ोन, व्हाट्सऐप या ईमेल से हमसे संपर्क करें।", en: "Reach us by phone, WhatsApp or email to plan your yatra." }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();
  const lang = useLang();
  const s = useSettings();
  const address = loc(s, "address", lang);
  return (
    <>
      <PageHero title={t("contact.title")} sub={t("contact.subtitle")} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2">
        <div className="space-y-4">
          <a href={telHref(s.phone)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"><Phone className="h-6 w-6 text-maroon" /><div><div className="text-sm text-muted-foreground">{t("contact.phone")}</div><div className="text-lg font-semibold">{s.phone}</div></div></a>
          <a href={waHref(s.whatsapp, t("whatsappMsg"))} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"><MessageCircle className="h-6 w-6 text-whatsapp" /><div><div className="text-sm text-muted-foreground">{t("common.whatsapp")}</div><div className="text-lg font-semibold">+{s.whatsapp}</div></div></a>
          <a href={`mailto:${s.email}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"><Mail className="h-6 w-6 text-maroon" /><div><div className="text-sm text-muted-foreground">{t("contact.email")}</div><div className="text-lg font-semibold">{s.email}</div></div></a>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"><MapPin className="h-6 w-6 shrink-0 text-maroon" /><div><div className="text-sm text-muted-foreground">{t("contact.office")}</div><div className="font-semibold">{address}</div><div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{t("contact.hours")}</div></div></div>
          <iframe title="map" loading="lazy" className="aspect-video w-full rounded-2xl border border-border" src={`https://www.google.com/maps?q=${encodeURIComponent(s.address_en ?? "Jaipur")}&output=embed`} />
        </div>
        <div className="rounded-2xl bg-mandala p-6"><h2 className="mb-4 font-display text-2xl text-maroon">{t("home.enquiryTitle")}</h2><EnquiryForm source="contact" compact withMessage /></div>
      </div>
    </>
  );
}
