import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calcInstallment } from "./debtUtils";

describe("calcInstallment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns monthly when >= 30 days remain", () => {
    const due = Date.now() + 90 * 86400000; // 90 days
    const result = calcInstallment(9000000, due);
    expect(result.period).toBe("bulan");
    expect(result.count).toBe(3);
    expect(result.amount).toBe(3000000);
    expect(result.overdue).toBe(false);
  });

  it("returns weekly when < 30 days remain", () => {
    const due = Date.now() + 14 * 86400000; // 14 days
    const result = calcInstallment(1000000, due);
    expect(result.period).toBe("minggu");
    expect(result.count).toBe(2);
    expect(result.amount).toBe(500000);
    expect(result.overdue).toBe(false);
  });

  it("marks overdue when past due date", () => {
    const due = Date.now() - 1 * 86400000; // 1 day ago
    const result = calcInstallment(1000000, due);
    expect(result.overdue).toBe(true);
  });

  it("rounds amount correctly", () => {
    const due = Date.now() + 60 * 86400000; // 60 days = 2 months
    const result = calcInstallment(1000000, due);
    expect(result.amount).toBe(500000);
  });

  it("handles 0 remaining amount", () => {
    const due = Date.now() + 30 * 86400000;
    const result = calcInstallment(0, due);
    expect(result.amount).toBe(0);
    expect(result.overdue).toBe(false);
  });
});
