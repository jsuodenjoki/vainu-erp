"use client";

import { createContext, useContext, useState, useEffect } from "react";
import en from "@/locales/en.json";
import fi from "@/locales/fi.json";

const translations = { en, fi };

const I18nContext = createContext({ t: (k) => k, locale: "fi", setLocale: () => {} });

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState("fi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("locale");
      if (saved && (saved === "en" || saved === "fi")) {
        setLocaleState(saved);
      }
    } catch (e) { /* localStorage unavailable */ }
  }, []);

  const setLocale = (lang) => {
    setLocaleState(lang);
    try {
      localStorage.setItem("locale", lang);
    } catch (e) { /* localStorage unavailable */ }
  };

  const t = (key, params) => {
    const dict = translations[locale] || translations["fi"];
    let value = getNestedValue(dict, key);
    if (value === null) {
      const fallback = getNestedValue(translations["en"], key);
      value = fallback !== null ? fallback : key;
    }
    if (params && typeof value === "string") {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, v);
      });
    }
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
