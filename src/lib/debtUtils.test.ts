import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calcInstallment,
  calculateMonthlyDebtObligation,
  totalMonthlyDebtObligation,
} from "./debtUtils";
import type { DebtEntry } from "./netWorth";

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

  describe("with interest rate", () => {
    it("adds simple interest for monthly installment", () => {
      const due = Date.now() + 90 * 86400000;
      const result = calcInstallment(10_000_000, due, 12);
      expect(result.period).toBe("bulan");
      expect(result.count).toBe(3);
      expect(result.overdue).toBe(false);
      expect(result.interestTotal).toBeGreaterThan(0);
      expect(result.interestTotal).toBe(295890);
    });

    it("adds simple interest for weekly installment", () => {
      const due = Date.now() + 14 * 86400000;
      const result = calcInstallment(5_000_000, due, 10);
      expect(result.period).toBe("minggu");
      expect(result.count).toBe(2);
      expect(result.overdue).toBe(false);
      expect(result.interestTotal).toBeGreaterThan(0);
      expect(result.interestTotal).toBe(19178);
    });

    it("returns 0 interest for 0% rate", () => {
      const due = Date.now() + 90 * 86400000;
      const result = calcInstallment(10_000_000, due, 0);
      expect(result.interestTotal).toBeUndefined();
      expect(result.amount).toBe(3333333);
    });

    it("handles overdue with interest rate gracefully", () => {
      const due = Date.now() - 1 * 86400000;
      const result = calcInstallment(1_000_000, due, 12);
      expect(result.overdue).toBe(true);
      expect(result.interestTotal).toBeUndefined();
    });
  });
});

describe("calculateMonthlyDebtObligation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns 0 for fully paid debt", () => {
    const debt: DebtEntry = {
      id: "1",
      name: "Lunas",
      totalAmount: 1000000,
      dueDate: Date.now() + 30 * 86400000,
      paidAmount: 1000000,
      createdAt: Date.now(),
    };
    expect(calculateMonthlyDebtObligation(debt)).toBe(0);
  });

  it("returns full remaining for overdue debt", () => {
    const debt: DebtEntry = {
      id: "2",
      name: "Telat",
      totalAmount: 5000000,
      dueDate: Date.now() - 5 * 86400000,
      paidAmount: 0,
      createdAt: Date.now(),
    };
    expect(calculateMonthlyDebtObligation(debt)).toBe(5000000);
  });

  it("returns installment amount for monthly debt", () => {
    const debt: DebtEntry = {
      id: "3",
      name: "Cicilan",
      totalAmount: 9000000,
      dueDate: Date.now() + 90 * 86400000,
      paidAmount: 0,
      createdAt: Date.now(),
    };
    // 3 bulan, @3jt/bln
    expect(calculateMonthlyDebtObligation(debt)).toBe(3000000);
  });

  it("normalizes weekly debt to monthly", () => {
    const debt: DebtEntry = {
      id: "4",
      name: "Mingguan",
      totalAmount: 1000000,
      dueDate: Date.now() + 14 * 86400000,
      paidAmount: 0,
      createdAt: Date.now(),
    };
    // 2 minggu, @500rb/minggu → monthly ≈ 500000 * 30/7
    expect(calculateMonthlyDebtObligation(debt)).toBe(2142857);
  });

  it("includes interest in monthly obligation", () => {
    const debt: DebtEntry = {
      id: "5",
      name: "Dengan Bunga",
      totalAmount: 10_000_000,
      dueDate: Date.now() + 90 * 86400000,
      paidAmount: 0,
      interestRate: 12,
      createdAt: Date.now(),
    };
    // Total = 10.000.000 + 295.890 = 10.295.890, / 3 = 3.431.963
    expect(calculateMonthlyDebtObligation(debt)).toBe(3431963);
  });

  it("handles partially paid debt", () => {
    const debt: DebtEntry = {
      id: "6",
      name: "Sebagian",
      totalAmount: 9000000,
      dueDate: Date.now() + 60 * 86400000,
      paidAmount: 3000000,
      createdAt: Date.now(),
    };
    // Sisa = 6jt, 2 bulan → @3jt
    expect(calculateMonthlyDebtObligation(debt)).toBe(3000000);
  });
});

describe("totalMonthlyDebtObligation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("sums all debts", () => {
    const debts: DebtEntry[] = [
      {
        id: "a",
        name: "A",
        totalAmount: 6000000,
        dueDate: Date.now() + 60 * 86400000,
        paidAmount: 0,
        createdAt: Date.now(),
      },
      {
        id: "b",
        name: "B",
        totalAmount: 12000000,
        dueDate: Date.now() + 90 * 86400000,
        paidAmount: 2000000,
        createdAt: Date.now(),
      },
    ];
    // A: 6jt/2bln = 3jt, B: sisa 10jt/3bln ≈ 3.333.333
    expect(totalMonthlyDebtObligation(debts)).toBe(6333333);
  });

  it("returns 0 for empty array", () => {
    expect(totalMonthlyDebtObligation([])).toBe(0);
  });
});
