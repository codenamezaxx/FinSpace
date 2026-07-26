"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Bell } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { NotificationCard } from "./NotificationCard";
import type { Notification } from "@/lib/db";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationSheet({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationSheetProps) {
  const { t } = useLanguage();
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Swipe down to dismiss (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 80) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20  transition-opacity duration-300 hidden lg:block"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("notification.title")}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed z-50 flex flex-col bg-surface shadow-2xl shadow-black/40 transition-all duration-300 ease-out
          /* Mobile: bottom sheet */
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          /* Desktop (≥lg): right slideover */
          lg:inset-y-0 lg:right-8 lg:left-auto lg:bottom-auto lg:top-8 lg:max-h-full lg:w-96 lg:rounded-2xl lg:border-l lg:border-border
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{t("notification.title")}</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] font-medium text-text-muted transition-colors hover:text-primary"
              >
                {t("notification.mark_all_read")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
              aria-label={t("notification.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
    </>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 py-16 px-4">
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
