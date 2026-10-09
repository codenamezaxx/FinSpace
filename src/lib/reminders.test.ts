import { describe, it, expect, beforeEach } from "vitest";
import {
  REMINDER_TIMES,
  nextOccurrence,
  firedKeyFor,
  wasFired,
  markFired,
  isRemindersEnabled,
  setRemindersEnabled,
  missedSlots,
} from "./reminders";

describe("reminders", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("has the 12:00, 17:00 and 21:00 slots", () => {
    expect(REMINDER_TIMES).toEqual([
      { hour: 12, minute: 0 },
      { hour: 17, minute: 0 },
      { hour: 21, minute: 0 },
    ]);
  });

  it("nextOccurrence returns today when the slot is still ahead", () => {
    const now = new Date(2026, 9, 4, 10, 0, 0);
    const at = nextOccurrence(now, { hour: 12, minute: 0 });
    expect(at.getFullYear()).toBe(2026);
    expect(at.getMonth()).toBe(9);
    expect(at.getDate()).toBe(4);
    expect(at.getHours()).toBe(12);
  });

  it("nextOccurrence rolls to tomorrow when the slot already passed", () => {
    const now = new Date(2026, 9, 4, 13, 0, 0);
    const at = nextOccurrence(now, { hour: 12, minute: 0 });
    expect(at.getDate()).toBe(5);
    expect(at.getHours()).toBe(12);
  });

  it("nextOccurrence rolls to tomorrow when exactly at the slot time", () => {
    const now = new Date(2026, 9, 4, 12, 0, 0);
    const at = nextOccurrence(now, { hour: 12, minute: 0 });
    expect(at.getDate()).toBe(5);
  });

  it("fired flags are per day and slot", () => {
    // Relative to today: fixed historical dates would be pruned as stale
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
    const otherDay = new Date(day.getTime() - 86400000);
    const slot = { hour: 12, minute: 0 };
    expect(wasFired(day, slot)).toBe(false);
    markFired(day, slot);
    expect(wasFired(day, slot)).toBe(true);
    // different day → not fired
    expect(wasFired(otherDay, slot)).toBe(false);
    // different slot → not fired
    expect(wasFired(day, { hour: 17, minute: 0 })).toBe(false);
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(firedKeyFor(day, slot)).toContain(
      `${day.getFullYear()}${pad(day.getMonth() + 1)}${pad(day.getDate())}:1200`
    );
  });

  it("is enabled by default and toggles persistently", () => {
    expect(isRemindersEnabled()).toBe(true);
    setRemindersEnabled(false);
    expect(isRemindersEnabled()).toBe(false);
    setRemindersEnabled(true);
    expect(isRemindersEnabled()).toBe(true);
  });
});

describe("missedSlots", () => {
  function at(hour: number): Date {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  it("returns past slots that have not fired", () => {
    expect(missedSlots(at(13))).toEqual([{ hour: 12, minute: 0 }]);
  });

  it("returns empty when all slots are still ahead", () => {
    expect(missedSlots(at(8))).toEqual([]);
  });

  it("excludes already-fired slots", () => {
    const now = at(22);
    markFired(now, { hour: 12, minute: 0 });
    expect(missedSlots(now)).toEqual([
      { hour: 17, minute: 0 },
      { hour: 21, minute: 0 },
    ]);
  });
});
