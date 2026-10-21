"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { isAccent, parseAccent, type Accent } from "@/lib/accents";

export type { Accent };

type Theme = "dark" | "light";

export function parseStoredAccent(raw: string | null): Accent {
  return parseAccent(raw);
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("finspace-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  return null;
}

function getStoredAccent(): Accent | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("finspace-accent");
    if (stored !== null && isAccent(stored)) return stored;
  } catch {
    // ignore
  }
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [accent, setAccentState] = useState<Accent>("default");

  // On mount, read stored theme (fallback light) and sync to state
  useEffect(() => {
    const stored = getStoredTheme();
    const active = stored ?? "light";
    setThemeState(active);
    document.documentElement.setAttribute("data-theme", active);
    const storedAccent = getStoredAccent();
    const activeAccent = storedAccent ?? "default";
    setAccentState(activeAccent);
    document.documentElement.setAttribute("data-accent", activeAccent);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      window.localStorage.setItem("finspace-theme", t);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const setAccent = useCallback((a: Accent) => {
    const next = parseStoredAccent(a);
    setAccentState(next);
    document.documentElement.setAttribute("data-accent", next);
    try {
      window.localStorage.setItem("finspace-accent", next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggleTheme, setTheme, accent, setAccent }),
    [theme, toggleTheme, setTheme, accent, setAccent]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
