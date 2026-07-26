"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { NotificationCard } from "./NotificationCard";
import type { Notification } from "@/lib/db";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationPanelProps) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-8 top-8 z-50 mt-2 w-90 rounded-xl border border-border bg-surface shadow-2xl shadow-black/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{t("notification.title")}</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-[11px] font-medium text-text-muted transition-colors hover:text-primary"
          >
            {t("notification.mark_all_read")}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border/50 p-2">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              onClearAll();
              onClose();
            }}
            className="w-full text-center text-[11px] font-medium text-text-muted transition-colors hover:text-danger"
          >
            {t("notification.clear_all")}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt">
        <Bell className="h-6 w-6 text-text-muted" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-secondary">
          {t("notification.empty_title")}
        </p>
        <p className="mt-1 text-xs text-text-muted leading-relaxed">
          {t("notification.empty_desc")}
        </p>
      </div>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl p-3"
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-alt" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-full animate-pulse rounded bg-surface-alt" />
            <div className="h-2.5 w-1/4 animate-pulse rounded bg-surface-alt" />
          </div>
        </div>
      ))}
    </div>
  );
}
