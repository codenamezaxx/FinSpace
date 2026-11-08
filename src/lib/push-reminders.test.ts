import { describe, expect, it } from "vitest";
import {
  getDailyReminderSlot,
  isReminderLocale,
  isValidLocalDate,
  isValidPushEndpoint,
  isValidTimezone,
  subscriptionKey,
} from "./push-reminders";

describe("push reminder scheduling", () => {
  it("schedules one daily reminder at 12:00 UTC using the device's local date", () => {
    expect(
      getDailyReminderSlot(new Date("2026-11-09T12:00:00.000Z"), "Asia/Jakarta")
    ).toEqual({ date: "2026-11-09", slot: "daily" });
    expect(
      getDailyReminderSlot(new Date("2026-11-09T12:00:00.000Z"), "Pacific/Kiritimati")
    ).toEqual({ date: "2026-11-10", slot: "daily" });
  });

  it("allows cron delivery retries within the five-minute UTC window", () => {
    expect(
      getDailyReminderSlot(new Date("2026-11-09T12:04:00.000Z"), "Asia/Jakarta")
    ).toEqual({ date: "2026-11-09", slot: "daily" });
    expect(
      getDailyReminderSlot(new Date("2026-11-09T12:05:00.000Z"), "Asia/Jakarta")
    ).toBeNull();
  });

  it("does not deliver outside the configured daily UTC time", () => {
    expect(
      getDailyReminderSlot(new Date("2026-11-09T11:59:00.000Z"), "Asia/Jakarta")
    ).toBeNull();
    expect(
      getDailyReminderSlot(new Date("2026-11-09T13:00:00.000Z"), "Asia/Jakarta")
    ).toBeNull();
  });

  it("validates locales, dates, timezones, and secure subscription endpoints", () => {
    expect(isReminderLocale("id")).toBe(true);
    expect(isReminderLocale("fr")).toBe(false);
    expect(isValidLocalDate("2024-02-29")).toBe(true);
    expect(isValidLocalDate("2025-02-29")).toBe(false);
    expect(isValidTimezone("Asia/Jakarta")).toBe(true);
    expect(isValidTimezone("invalid/zone")).toBe(false);
    expect(isValidPushEndpoint("https://fcm.googleapis.com/subscription")).toBe(true);
    expect(isValidPushEndpoint("https://push.example.test/subscription")).toBe(false);
    expect(isValidPushEndpoint("http://fcm.googleapis.com/subscription")).toBe(false);
  });

  it("creates a stable non-reversible subscription key", () => {
    const first = subscriptionKey("https://push.example.test/secret");
    expect(subscriptionKey("https://push.example.test/secret")).toBe(first);
    expect(first).toMatch(/^finspace:push:subscription:[a-f0-9]{64}$/);
    expect(first).not.toContain("secret");
  });
});
