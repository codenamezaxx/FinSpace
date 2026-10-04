"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  REMINDER_TIMES,
  REMINDERS_CHANGED_EVENT,
  isRemindersEnabled,
  wasFired,
  markFired,
  nextOccurrence,
  type ReminderTime,
} from "@/lib/reminders";

async function showSystemNotification(
  title: string,
  body: string
): Promise<void> {
  const options = {
    body,
    tag: "finspace-expense-reminder",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: { url: "/dashboard" },
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    // fall through to the page-context Notification
  }
  try {
    new Notification(title, { body, tag: options.tag });
  } catch {
    // Permission revoked mid-flight — nothing more we can do
  }
}

/**
 * Schedules the daily expense-logging reminders (12:00, 17:00, 21:00).
 * Mount ONCE (AppShell). Each slot fires at most once per day, is skipped
 * when the user already logged an expense that day, and rolls over to the
 * next day after firing. Also writes an in-app notification (bell badge).
 */
export function useExpenseReminders(): void {
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    let timers: number[] = [];
    let cancelled = false;

    const schedule = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      if (cancelled) return;
      if (!isRemindersEnabled()) return;
      if (Notification.permission !== "granted") return;
      const now = new Date();
      for (const rt of REMINDER_TIMES) {
        const at = nextOccurrence(now, rt);
        const delay = at.getTime() - Date.now();
        if (delay <= 0 || delay > 0x7fffffff) continue;
        timers.push(window.setTimeout(() => void fire(rt), delay));
      }
    };

    const fire = async (rt: ReminderTime) => {
      try {
        if (!isRemindersEnabled()) return;
        if (Notification.permission !== "granted") return;
        const today = new Date();
        if (wasFired(today, rt)) return;
        markFired(today, rt);

        const { db } = await import("@/lib/db");
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).getTime();
        const loggedToday = await db.transactions
          .where("timestamp")
          .aboveOrEqual(startOfToday)
          .filter((tx) => tx.type === "expense" && !tx.transferId)
          .count();

        // Already logged today — nothing to nag about
        if (loggedToday > 0) return;

        const title = t("notification.reminder_title");
        const body = t("notification.reminder_body");
        await db.notifications.add({
          id: `ntf_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
          type: "reminder",
          title,
          message: body,
          read: 0,
          createdAt: Date.now(),
        });
        await showSystemNotification(title, body);
      } catch {
        // Never let a reminder crash the app
      } finally {
        if (!cancelled) schedule();
      }
    };

    schedule();
    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const onChanged = () => schedule();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(REMINDERS_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(REMINDERS_CHANGED_EVENT, onChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
}
