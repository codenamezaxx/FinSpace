import { describe, it, expect } from "vitest";
import {
  buildFinnySnapshotText,
  toSnapshotTx,
  type FinnySnapshot,
} from "./contextSnapshot";

const BASE: FinnySnapshot = {
  monthLabel: "2026-10",
  income: 5000000,
  expenses: 2000000,
  pockets: [
    { name: "Tunai", balance: 1000000 },
    { name: "BCA", balance: 2000000 },
  ],
  pocketTotal: 3000000,
  netWorth: 8000000,
  assets: [{ name: "Emas", amount: 5000000 }],
  liabilities: [],
  debts: [{ name: "Motor", amount: 1000000, extra: "jatuh tempo 2027-01-01" }],
  recent: [
    {
      type: "expense",
      amount: 35000,
      merchant: "Bakso",
      category: "Kebutuhan",
      date: "2026-10-04",
    },
  ],
  budget: {
    needsPct: 50,
    wantsPct: 30,
    savingsPct: 20,
    needsAlloc: 2500000,
    wantsAlloc: 1500000,
    savingsAlloc: 1000000,
    needsSpent: 1000000,
    wantsSpent: 500000,
    savingsDeposits: 250000,
  },
};

describe("buildFinnySnapshotText", () => {
  it("contains totals, pockets, net worth and recent transactions", () => {
    const text = buildFinnySnapshotText(BASE);
    expect(text).toContain("2026-10");
    expect(text).toContain("Tunai");
    expect(text).toContain("BCA");
    expect(text).toContain("Bakso");
    expect(text).toContain("Motor");
    expect(text).toContain("jangan mengarang");
  });

  it("renders dashes for empty sections", () => {
    const text = buildFinnySnapshotText({ ...BASE, assets: [], recent: [] });
    expect(text).toContain("Aset: -");
    expect(text).toContain("Transaksi terakhir: -");
  });

  it("renders the budget block with remainders", () => {
    const text = buildFinnySnapshotText(BASE);
    expect(text).toContain("BLOK BUDGET");
    expect(text).toContain("sisa Rp1.500.000");
    expect(text).toContain("kurang Rp750.000");
  });

  it("caps list lengths for token budget", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      name: `A${i}`,
      amount: i,
    }));
    const text = buildFinnySnapshotText({ ...BASE, assets: many });
    expect(text).not.toContain("A49");
    expect(text).toContain("A0");
  });
});

describe("toSnapshotTx", () => {
  it("formats the date as YYYY-MM-DD", () => {
    const tx = toSnapshotTx({
      type: "expense",
      amount: 1000,
      merchant: "X",
      category: "Kebutuhan",
      timestamp: new Date(2026, 9, 4, 12).getTime(),
    });
    expect(tx.date).toBe("2026-10-04");
  });
});
