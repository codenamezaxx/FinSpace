"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();
  const nextLang = lang === "id" ? "en" : "id";

  if (compact) {
    // Desktop: icon + current lang code
    return (
      <button
        onClick={() => setLang(nextLang)}
        className="flex items-center justify-center rounded-lg p-2 text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary"
        aria-label={t("common.language", { lang: nextLang.toUpperCase() })}
      >
        <Globe className="h-5 w-5" />
        <span className="ml-1.5 text-xs font-semibold">{lang.toUpperCase()}</span>
      </button>
    );
  }

  // Mobile dropdown row
  return (
    <button
      onClick={() => setLang(nextLang)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
    >
      <Globe className="h-4 w-4" />
      <span>{lang === "id" ? "English" : "Bahasa Indonesia"}</span>
    </button>
  );
}
