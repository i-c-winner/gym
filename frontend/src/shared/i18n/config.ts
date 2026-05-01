import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { kk } from "./locales/kk";
import { ru } from "./locales/ru";
import { uz } from "./locales/uz";

const defaultLanguage = "ru";
const languageStorageKey = "app-language";

const resources = {
  ru: {
    translation: ru,
  },
  uz: {
    translation: uz,
  },
  kk: {
    translation: kk,
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
