"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLanguage } from "@/lib/i18n";
import { db } from "@/lib/db";
import {
  getPushReminderSubscription,
  isPushReminderActive,
  syncExpenseReminderActivity,
} from "@/lib/push-client";
import {
  REMINDER_TIMES,
  REMINDERS_CHANGED_EVENT,
  isRemindersEnabled,
  wasFired,
  markFired,
  missedSlots,
  nextOccurrence,
  type ReminderTime,
} from "@/lib/reminders";

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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
      // Race against a timeout: serviceWorker.ready never settles when no
      // worker is registered (e.g. SW disabled in dev), which would hang
      // forever and block the page-context fallback below.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("sw-timeout")), 3000);
      });
      try {
        const reg = await Promise.race([navigator.serviceWorker.ready, timeout]);
        await reg.showNotification(title, options);
        return;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
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
  const { t, lang } = useLanguage();
  const [today, setToday] = useState("");
  const [activityRefresh, setActivityRefresh] = useState(0);
  const lastSyncedActivity = useRef("");
  const dayStart = useMemo(() => {
    if (!today) return 0;
    const [year, month, day] = today.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }, [today]);
  const expenseCount = useLiveQuery(
    () =>
      dayStart
        ? db.transactions
            .where("timestamp")
            .aboveOrEqual(dayStart)
            .filter((tx) => tx.type === "expense" && !tx.transferId)
            .count()
        : Promise.resolve(0),
    [dayStart]
  );

  useEffect(() => {
    const refreshDay = () => setToday(dateKey(new Date()));
    refreshDay();
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        refreshDay();
        setActivityRefresh((value) => value + 1);
      }
    };
    const refreshOnOnline = () => setActivityRefresh((value) => value + 1);
    document.addEventListener("visibilitychange", refreshOnVisible);
    window.addEventListener("online", refreshOnOnline);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(refreshDay, midnight.getTime() - now.getTime());
    return () => {
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.removeEventListener("online", refreshOnOnline);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (
      !today ||
      expenseCount === undefined ||
      !isRemindersEnabled() ||
      !isPushReminderActive()
    ) {
      return;
    }

    const hasLoggedExpense = expenseCount > 0;
    const signature = `${today}:${lang}:${hasLoggedExpense}`;
    if (signature === lastSyncedActivity.current) return;

    void syncExpenseReminderActivity(lang, hasLoggedExpense)
      .then(() => {
        lastSyncedActivity.current = signature;
      })
      .catch((error) => {
        console.error("Could not sync expense activity for push reminders:", error);
      });
  }, [activityRefresh, expenseCount, lang, today]);

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
      // Catch-up: fire the latest slot missed while the app was closed.
      // fire() re-checks permission, fired flags and today's expenses.
      const missed = missedSlots(now);
      if (missed.length > 0) void fire(missed[missed.length - 1]);
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
        const pushSubscription = isPushReminderActive()
          ? await getPushReminderSubscription()
          : null;
        if (!pushSubscription) {
          await showSystemNotification(title, body);
        }
      } catch (error) {
        console.error("Expense reminder failed:", error);
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
  }, [t]);
}
