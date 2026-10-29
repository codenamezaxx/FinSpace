"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalancePrivacy } from "@/lib/balancePrivacy";
import { useLanguage } from "@/lib/i18n";

interface PrivacyToggleProps {
  compact?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function PrivacyToggle({ compact = false, className = "", "aria-label": ariaLabelProp }: PrivacyToggleProps) {
  const { isHidden, toggle } = useBalancePrivacy();
  const { t } = useLanguage();

  const ariaLabel = ariaLabelProp ?? (isHidden ? t("privacy.show_amounts") : t("privacy.hide_amounts"));

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      aria-pressed={isHidden}
      className={`
        flex items-center justify-center rounded-lg transition-all duration-200
        ${compact ? "h-8 w-8" : "h-9 w-9"}
        ${isHidden ? "text-text-secondary bg-surface-alt hover:bg-surface" : "text-primary bg-primary/10 hover:bg-primary/20"}
        ${className}
      `}
    >
      {isHidden ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
    </button>
  );
}