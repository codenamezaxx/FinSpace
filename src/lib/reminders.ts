/**
 * Daily expense-logging reminders (12:00, 17:00, 21:00 local time).
 *
 * Pure scheduling/storage helpers — no React, no side effects beyond
 * localStorage. The actual timers + notification display live in
 * `useExpenseReminders`. Fired-slots are recorded per day so reloads
 * and reschedules never double-fire.
 */

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** Daily reminder slots (local time). */
export const REMINDER_TIMES: ReminderTime[] = [
  { hour: 12, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 21, minute: 0 },
];

export const REMINDERS_CHANGED_EVENT = "finspace-reminders-changed";

const ENABLED_KEY = "finspace-reminders-enabled";
const FIRED_PREFIX = "finspace-reminder-fired:";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function isRemindersEnabled(): boolean {
  if (typeof window === "undefined") return false;
  // Default ON — actual display still requires Notification permission,
  // which is requested from the Settings toggle (user gesture).
  return localStorage.getItem(ENABLED_KEY) !== "0";
}

export function setRemindersEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  window.dispatchEvent(new CustomEvent(REMINDERS_CHANGED_EVENT));
}

export function firedKeyFor(date: Date, t: ReminderTime): string {
  return `${FIRED_PREFIX}${dayKey(date)}:${pad(t.hour)}${pad(t.minute)}`;
}

export function wasFired(date: Date, t: ReminderTime): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(firedKeyFor(date, t)) === "1";
  } catch {
    return false;
  }
}

export function markFired(date: Date, t: ReminderTime): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(firedKeyFor(date, t), "1");
    pruneFiredFlags();
  } catch {
    // Storage unavailable (private mode) — worst case a duplicate fires
  }
}

/** Drop fired-flags older than 2 days so the keyspace stays tiny. */
function pruneFiredFlags(): void {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffKey = dayKey(cutoff);
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(FIRED_PREFIX)) continue;
      const day = key.slice(FIRED_PREFIX.length, FIRED_PREFIX.length + 8);
      if (day < cutoffKey) stale.push(key);
    }
    stale.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * Next occurrence of a daily slot: today if still ahead (strictly future),
 * otherwise tomorrow. Exported for tests.
 */
export function nextOccurrence(now: Date, t: ReminderTime): Date {
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    t.hour,
    t.minute,
    0,
    0
  );
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Today's slots whose time already passed and that have not fired yet.
 * Used for catch-up when the app opens after a missed slot.
 */
export function missedSlots(now: Date): ReminderTime[] {
  return REMINDER_TIMES.filter((t) => {
    const slot = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      t.hour,
      t.minute,
      0,
      0
    );
    return slot.getTime() <= now.getTime() && !wasFired(now, t);
  });
}
