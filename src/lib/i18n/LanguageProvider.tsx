"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations } from "./translations";

type Lang = "id" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "finspace_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "id") setLangState(stored);
    setHydrated(true);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang] as Record<string, any>;
      let val = key.split(".").reduce((obj, k) => obj?.[k], dict) as
        unknown as
        | string
        | undefined;
      if (val === undefined) {
        // Fallback to English
        const enDict = translations.en as Record<string, any>;
        val = key
          .split(".")
          .reduce((obj, k) => obj?.[k], enDict) as unknown as
        | string
        | undefined;
      }
      if (val === undefined) return key;
      if (!vars) return val;
      return val.replace(
        /\{\{(\w+)\}\}/g,
        (_, k: string) => String(vars[k] ?? `{{${k}}}`),
      );
    },
    [lang],
  );

  // Pre-hydration: render children as-is in default locale (ID)
  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for tests and edge cases — return default ID locale t()
    const fallbackT = (key: string, vars?: Record<string, string | number>) => {
      const dict = translations.id as Record<string, any>;
      let val = key.split(".").reduce((obj, k) => obj?.[k], dict) as unknown as string | undefined;
      if (val === undefined) {
        const enDict = translations.en as Record<string, any>;
        val = key.split(".").reduce((obj, k) => obj?.[k], enDict) as unknown as string | undefined;
      }
      if (val === undefined) return key;
      if (!vars) return val;
      return val.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? `{{${k}}}`));
    };
    return { lang: "id", setLang: () => {}, t: fallbackT };
  }
  return ctx;
}
