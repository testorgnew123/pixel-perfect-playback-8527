import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLang, type Lang } from "./i18n";
import { settingsQuery } from "./queries";
import { loc } from "./format";

export function useLang(): Lang {
  const p = useParams({ strict: false }) as { lang?: string };
  return isLang(p.lang) ? p.lang : "hi";
}

export function useSettings() {
  const { data } = useSuspenseQuery(settingsQuery);
  const lang = useLang();
  return { ...data, brand: loc(data, "brand_name", lang) };
}
