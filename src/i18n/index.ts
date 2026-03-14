import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./locales/en.json";
import bg from "./locales/bg.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

export type SupportedLanguage = "en" | "bg" | "fr" | "es";

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "bg", "fr", "es"];
const LANGUAGE_STORAGE_KEY = "app:selected-language";

function normalizeLanguage(value?: string | null): SupportedLanguage | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return (
    SUPPORTED_LANGUAGES.find(
      (lang) => normalized === lang || normalized.startsWith(`${lang}-`)
    ) ?? null
  );
}

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

export async function loadStoredLanguagePreference() {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const lang = normalizeLanguage(stored);
    if (lang && i18n.language !== lang) {
      await i18n.changeLanguage(lang);
    }
  } catch {
    // Non-fatal: app can continue with default language.
  }
}

export async function saveLanguagePreference(lang: SupportedLanguage) {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Non-fatal: language still changes for current session.
  }
}

export default i18n;
