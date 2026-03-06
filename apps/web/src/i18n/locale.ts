import i18n from "./i18n";
import type { LocaleOption } from "@/constants";

export function getClientLocale(): LocaleOption {
  const stored = localStorage.getItem("sigeo-locale");
  if (stored === "pt" || stored === "en") return stored;
  return "pt";
}

export function setClientLocale(locale: LocaleOption): void {
  localStorage.setItem("sigeo-locale", locale);
  i18n.changeLanguage(locale);
}
