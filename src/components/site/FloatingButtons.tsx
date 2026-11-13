import { useTranslation } from "react-i18next";
import { MessageCircle, Phone } from "lucide-react";
import { useSettings } from "@/lib/use-lang";
import { telHref, waHref } from "@/lib/format";

export function FloatingButtons() {
  const { t } = useTranslation();
  const s = useSettings();
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 print:hidden">
      <a href={telHref(s.phone)} aria-label={t("common.callNow")} className="grid h-14 w-14 place-items-center rounded-full bg-maroon text-maroon-foreground shadow-warm md:hidden">
        <Phone className="h-6 w-6" />
      </a>
      <a href={waHref(s.whatsapp, t("whatsappMsg"))} target="_blank" rel="noreferrer" aria-label={t("common.whatsapp")} className="grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-success-foreground shadow-warm transition hover:scale-105">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
