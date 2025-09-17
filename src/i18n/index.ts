import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import bg from "./locales/bg.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

i18n.use(initReactI18next).init({
  fallbackLng: "es",
  lng: "en",
  resources: {
    en: { translation: en },
    bg: { translation: bg },
    fr: { translation: fr },
    es: { translation: es },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
