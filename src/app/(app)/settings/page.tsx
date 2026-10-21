"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Info, BellRing } from "lucide-react";
import Link from "next/link";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  isRemindersEnabled,
  setRemindersEnabled,
  REMINDERS_CHANGED_EVENT,
} from "@/lib/reminders";
import { useLanguage } from "@/lib/i18n";
import { AccentPicker } from "@/components/settings/AccentPicker";
import { ProfileSection } from "@/components/settings/ProfileSection";

interface SyncLogEntry {
  time: string;
  phase: string;
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const sync = useSyncStatus();
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const prevPhase = useRef("__initial__");

  // ── Daily expense reminders ──
  const [remEnabled, setRemEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    const refresh = () => {
      setRemEnabled(isRemindersEnabled());
      setNotifPermission(
        typeof window !== "undefined" && "Notification" in window
          ? Notification.permission
          : "unsupported"
      );
    };
    refresh();
    window.addEventListener(REMINDERS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(REMINDERS_CHANGED_EVENT, refresh);
  }, []);

  // Effective state: stored preference AND granted permission
  const remindersEffective = remEnabled && notifPermission === "granted";

  const handleReminderToggle = async () => {
    if (remindersEffective) {
      setRemindersEnabled(false);
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const p = await Notification.requestPermission();
      setNotifPermission(p);
      if (p !== "granted") return;
    } else if (Notification.permission === "denied") {
      return;
    }
    setRemindersEnabled(true);
  };

  // ── Sync history: track phase transitions ──
  useEffect(() => {
    if (sync.phase !== prevPhase.current) {
      const now = new Date();
      const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const label =
        sync.phase === "pushing" || sync.phase === "pulling"
          ? t("settings.syncing")
          : sync.phase === "error"
            ? t("settings.sync_failed")
            : sync.phase === "completed"
              ? t("settings.synced")
              : sync.phase;
      setSyncLog((prev) => [{ time, phase: label }, ...prev].slice(0, 20));
      prevPhase.current = sync.phase;
    }
  }, [sync.phase, t]);

  return (
    <div className="mx-auto px-4 py-2">
      {/* ── Back button ── */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("settings.back")}
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-text-primary">{t("settings.title")}</h1>
      <p className="mb-8 text-sm text-text-muted">
        {t("settings.manage_sync")}
      </p>

      {/* ── Profile ── */}
      <ProfileSection />

      {/* ── Sync history ── */}
      <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
          <RefreshCw className="h-5 w-5 text-primary" />
          {t("settings.sync_history")}
        </h2>

        {syncLog.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("settings.no_sync_activity")}
          </p>
        ) : (
          <div className="space-y-1">
            {syncLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm">
                <span className="w-16 shrink-0 text-xs text-text-muted font-mono">
                  {entry.time}
                </span>
                <span
                  className={`font-mono text-xs ${
                    entry.phase === t("settings.synced")
                      ? "text-success"
                      : entry.phase === t("settings.sync_failed")
                        ? "text-danger"
                        : entry.phase === t("settings.syncing")
                          ? "text-primary"
                          : "text-text-muted"
                  }`}
                >
                  {entry.phase}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Daily reminders ── */}
      <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-text-primary">
          <BellRing className="h-5 w-5 text-primary" />
          {t("settings.reminders_title")}
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {t("settings.reminders_desc")}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-sm font-medium ${
              remindersEffective ? "text-success" : "text-text-muted"
            }`}
          >
            {remindersEffective
              ? t("settings.reminders_on")
              : t("settings.reminders_off")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={remindersEffective}
            aria-label={t("settings.reminders_title")}
            onClick={handleReminderToggle}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              remindersEffective ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                remindersEffective ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
        {remEnabled && notifPermission === "denied" && (
          <p className="mt-3 text-xs text-warning">
            {t("settings.reminders_need_permission")}
          </p>
        )}
      </div>

      {/* ── Appearance ── */}
      <AccentPicker />

      {/* ── Info footer ── */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
          <Info className="h-5 w-5 text-primary" />
          {t("settings.about")}
        </h2>
        <div className="space-y-2 text-xs text-text-muted">
          <p>
            {t("settings.info_text")}
          </p>
        </div>
      </div>
    </div>
  );
}
