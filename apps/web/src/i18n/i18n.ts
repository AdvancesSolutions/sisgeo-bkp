import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/messages/en.json";
import pt from "@/i18n/messages/pt.json";

const savedLocale = localStorage.getItem("sigeo-locale");
const initialLng = savedLocale === "en" || savedLocale === "pt" ? savedLocale : "pt";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: initialLng,
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
});

export default i18n;
