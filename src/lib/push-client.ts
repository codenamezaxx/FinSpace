"use client";

import type { ReminderLocale } from "@/lib/push-reminders";
import { db } from "@/lib/db";

export interface PushActivity {
  timezone: string;
  locale: ReminderLocale;
  activityDate: string;
  hasLoggedExpense: boolean;
}

const ACTIVE_KEY = "finspace-push-reminders-active";

function applicationServerKey(): Uint8Array {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error("Push notifications are not configured for this app.");
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const decoded = atob(`${key}${padding}`.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function postJson(url: string, method: "POST" | "DELETE", body: unknown): Promise<void> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? `Push request failed (${response.status}).`);
  }
}

export function isPushReminderFeatureAvailable(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushReminderSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.pushManager.getSubscription() ?? null;
}

export function isPushReminderActive(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(ACTIVE_KEY) === "1";
}

export function getPushActivity(
  locale: ReminderLocale,
  hasLoggedExpense: boolean
): PushActivity {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    locale,
    activityDate: localDateKey(new Date()),
    hasLoggedExpense,
  };
}

export async function subscribeToExpenseReminders(
  locale: ReminderLocale,
  hasLoggedExpense: boolean
): Promise<void> {
  if (!isPushReminderFeatureAvailable()) {
    throw new Error("Push notifications are not supported or configured on this device.");
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    throw new Error("The app service worker is not ready yet. Reload the installed app and try again.");
  }
  let subscription = await registration.pushManager.getSubscription();
  let createdHere = false;
  if (!subscription) {
    const key = applicationServerKey();
    const applicationServerKeyBuffer = new ArrayBuffer(key.byteLength);
    new Uint8Array(applicationServerKeyBuffer).set(key);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKeyBuffer,
    });
    createdHere = true;
  }

  try {
    await postJson("/api/push/subscriptions", "POST", {
      subscription: subscription.toJSON(),
      ...getPushActivity(locale, hasLoggedExpense),
    });
    localStorage.setItem(ACTIVE_KEY, "1");
  } catch (error) {
    if (createdHere) await subscription.unsubscribe();
    throw error;
  }
}

export async function unsubscribeFromExpenseReminders(): Promise<boolean> {
  const subscription = await getPushReminderSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    localStorage.removeItem(ACTIVE_KEY);
    try {
      await postJson("/api/push/subscriptions", "DELETE", { endpoint });
    } catch (error) {
      console.error("Device push was disabled locally, but server cleanup is pending:", error);
      return false;
    }
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
  return true;
}

export async function syncExpenseReminderActivity(
  locale: ReminderLocale,
  hasLoggedExpense: boolean
): Promise<void> {
  if (!isPushReminderActive()) return;
  const subscription = await getPushReminderSubscription();
  if (!subscription) {
    localStorage.removeItem(ACTIVE_KEY);
    return;
  }
  await postJson("/api/push/activity", "POST", {
    endpoint: subscription.endpoint,
    ...getPushActivity(locale, hasLoggedExpense),
  });
}

export async function hasPushReminderSubscription(): Promise<boolean> {
  return Boolean(await getPushReminderSubscription());
}

export async function hasLoggedExpenseToday(): Promise<boolean> {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const count = await db.transactions
    .where("timestamp")
    .aboveOrEqual(startOfToday)
    .filter((transaction) => transaction.type === "expense" && !transaction.transferId)
    .count();
  return count > 0;
}
