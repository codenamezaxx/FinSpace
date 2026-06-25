"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

interface ThemeToggleProps {
  compact?: boolean;
}

/** Both Sun and Moon are always in the DOM.
 *  CSS `.light-only`/`.dark-only` classes hide/show based on `data-theme` attribute.
 *  No React state involved → zero hydration mismatch. */
export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center rounded-lg p-2 text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 light-only" />
        <Moon className="h-5 w-5 dark-only" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-xs font-medium text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-secondary"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 light-only" />
      <Moon className="h-5 w-5 dark-only" />
      <span className="light-only">Dark Mode</span>
      <span className="dark-only">Light Mode</span>
    </button>
  );
}
