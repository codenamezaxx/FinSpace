"use client";

import { Palette } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/i18n";
import { ACCENT_IDS, ACCENT_DOTS } from "@/lib/accents";

export function AccentPicker() {
  const { accent, setAccent } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-text-primary">
        <Palette className="h-5 w-5 text-primary" />
        {t("settings.appearance_title")}
      </h2>
      <p className="mb-4 text-sm text-text-muted">{t("settings.accent_desc")}</p>
      <div
        role="radiogroup"
        aria-label={t("settings.accent_label")}
        className="grid gap-2 sm:grid-cols-2"
      >
        {ACCENT_IDS.map((id) => {
          const active = accent === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAccent(id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border-primary bg-primary/10 text-text-primary"
                  : "border-border text-text-muted hover:bg-surface-alt hover:text-text-primary"
              }`}
            >
              <span className="flex -space-x-1">
                {ACCENT_DOTS[id].map((c) => (
                  <span
                    key={c}
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              {t(`settings.accent_${id}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
