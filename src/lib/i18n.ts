import i18next, { type i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";

export const LANGS = ["hi", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: unknown): v is Lang => v === "hi" || v === "en";

const base = i18next.createInstance();
void base.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: "hi",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnObjects: true,
  initImmediate: false,
});

/** One isolated instance per language so concurrent SSR requests never share state. */
const cache = new Map<Lang, I18n>();
export function getI18n(lang: Lang): I18n {
  let inst = cache.get(lang);
  if (!inst) {
    inst = base.cloneInstance({ lng: lang });
    cache.set(lang, inst);
  }
  return inst;
}
