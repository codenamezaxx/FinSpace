"use client";

import { Bell } from "lucide-react";
import { useNotificationsContext } from "./NotificationsProvider";
import { useLanguage } from "@/lib/i18n";

interface BellButtonProps {
  /** Render as icon-only (for desktop topbar) or with label */
  variant?: "icon" | "icon-with-badge";
  className?: string;
}

export function BellButton({ variant = "icon-with-badge", className = "" }: BellButtonProps) {
  const { unreadCount, toggleNotifications } = useNotificationsContext();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      className={`relative flex items-center justify-center rounded-lg p-2 text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary ${className}`}
      aria-label={t("notification.bell_label", { count: unreadCount })}
    >
      <Bell className="h-5 w-5" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white shadow-sm shadow-danger/30">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
