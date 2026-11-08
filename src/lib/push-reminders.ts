import { createHash } from "node:crypto";
import type { PushSubscription } from "web-push";

export type ReminderLocale = "en" | "id";

export interface PushReminderRecord {
  subscription: PushSubscription;
  timezone: string;
  locale: ReminderLocale;
  activityDate: string;
  hasLoggedExpense: boolean;
}

export function isValidTimezone(timezone: unknown): timezone is string {
  if (typeof timezone !== "string" || timezone.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function getDailyReminderSlot(
  now: Date,
  timezone: string
): { date: string; slot: string } | null {
  if (now.getUTCHours() !== 12 || now.getUTCMinutes() > 4) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    slot: "daily",
  };
}

export function subscriptionKey(endpoint: string): string {
  const digest = createHash("sha256").update(endpoint).digest("hex");
  return `finspace:push:subscription:${digest}`;
}

export function isReminderLocale(value: unknown): value is ReminderLocale {
  return value === "en" || value === "id";
}

export function isValidLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidPushSubscription(value: unknown): value is PushSubscription {
  if (!value || typeof value !== "object") return false;
  const subscription = value as Partial<PushSubscription>;
  return (
    isValidPushEndpoint(subscription.endpoint) &&
    typeof subscription.keys?.p256dh === "string" &&
    subscription.keys.p256dh.length <= 256 &&
    typeof subscription.keys.auth === "string" &&
    subscription.keys.auth.length <= 256
  );
}

export function isValidPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (hostname === "fcm.googleapis.com" ||
        hostname === "push.services.mozilla.com" ||
        hostname.endsWith(".push.services.mozilla.com") ||
        hostname === "web.push.apple.com" ||
        hostname.endsWith(".notify.windows.com"))
    );
  } catch {
    return false;
  }
}

export function createPushSubscription(
  timezone: string,
  locale: ReminderLocale,
  activityDate: string,
  hasLoggedExpense: boolean,
  subscription: PushSubscription
): PushReminderRecord {
  return { subscription, timezone, locale, activityDate, hasLoggedExpense };
}
