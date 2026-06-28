import { describe, it, expect } from "vitest";
import { calculateNetWorth } from "./netWorth";

// Make a helper to create minimal assets/liabilities/debts
const mkAsset = (overrides = {}) => ({
  id: "a1", name: "Test", amount: 1000000, type: "liquid" as const,
  createdAt: Date.now(), ...overrides,
});
const mkLiability = (overrides = {}) => ({
  id: "l1", name: "Test", amount: 500000,
  createdAt: Date.now(), ...overrides,
});
const mkDebt = (overrides = {}) => ({
  id: "d1", name: "Test", totalAmount: 2000000, paidAmount: 0,
  dueDate: Date.now() + 365 * 86400000, createdAt: Date.now(), ...overrides,
});

describe("calculateNetWorth", () => {
  it("computes NW = balance + assets - liabilities - debts", () => {
    const result = calculateNetWorth(
      [mkAsset({ amount: 5000000 })],
      [mkLiability({ amount: 1000000 })],
      3000000,
      [mkDebt({ totalAmount: 2000000, paidAmount: 500000 })]
    );
    // 3jt + 5jt - 1jt - 1.5jt = 5.5jt
    expect(result.netWorth).toBe(5500000);
  });

  it("handles empty lists", () => {
    const result = calculateNetWorth([], [], 0, []);
    expect(result.netWorth).toBe(0);
    expect(result.totalBalance).toBe(0);
    expect(result.totalDebts).toBe(0);
  });

  it("subtracts only remaining debt amount", () => {
    const result = calculateNetWorth([], [], 5000000, [
      mkDebt({ totalAmount: 3000000, paidAmount: 1000000 }),
    ]);
    expect(result.totalDebts).toBe(2000000);
    expect(result.netWorth).toBe(3000000);
  });

  it("does not allow negative debt remaining", () => {
    const result = calculateNetWorth([], [], 0, [
      mkDebt({ totalAmount: 1000000, paidAmount: 2000000 }),
    ]);
    expect(result.totalDebts).toBe(0);
  });
});
