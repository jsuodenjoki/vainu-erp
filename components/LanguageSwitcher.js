"use client";

import { useI18n } from "@/components/I18nProvider";

export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={`absolute top-4 right-4 flex gap-1 ${className}`}>
      <button
        onClick={() => setLocale("fi")}
        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
          locale === "fi"
            ? "bg-indigo-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
        }`}
      >
        FI
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
          locale === "en"
            ? "bg-indigo-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
