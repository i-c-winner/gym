"use client";

import type React from "react";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { defaultLanguage, i18n, languageStorageKey } from "./config";

function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = window.localStorage.getItem(languageStorageKey) ?? defaultLanguage;
    if (stored !== i18n.language) {
      void i18n.changeLanguage(stored);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

export { I18nProvider };
