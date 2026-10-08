import { describe, it, expect } from "vitest";
import { isInMonthYear } from "./TransactionList";

const ts = (y: number, m: number, d: number) =>
  new Date(y, m, d, 12).getTime();

describe("isInMonthYear", () => {
  it("matches the exact month and year", () => {
    expect(isInMonthYear(ts(2026, 9, 4), 9, 2026)).toBe(true);
  });

  it("rejects other months", () => {
    expect(isInMonthYear(ts(2026, 8, 30), 9, 2026)).toBe(false);
  });

  it("rejects other years", () => {
    expect(isInMonthYear(ts(2025, 9, 4), 9, 2026)).toBe(false);
  });

  it("handles month boundaries (first/last second)", () => {
    expect(isInMonthYear(new Date(2026, 9, 1, 0, 0, 0).getTime(), 9, 2026)).toBe(true);
    expect(
      isInMonthYear(new Date(2026, 9, 31, 23, 59, 59).getTime(), 9, 2026)
    ).toBe(true);
    expect(isInMonthYear(new Date(2026, 10, 1, 0, 0, 0).getTime(), 9, 2026)).toBe(false);
  });
});
