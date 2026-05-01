import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const defaultLanguage = "ru";
const languageStorageKey = "app-language";

const resources = {
  ru: {
    translation: {},
  },
  uz: {
    translation: {},
  },
  kk: {
    translation: {},
  },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: defaultLanguage,
    supportedLngs: Object.keys(resources),
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export { i18n, languageStorageKey, defaultLanguage };
