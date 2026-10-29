import { describe, it, expect } from "vitest";
import { buildMonthlyReportPdf, prepareReportData } from "@/lib/monthlyReportPdf";
import type { Transaction } from "@/lib/db";
import type { Pocket } from "@/lib/pocket";

const MONTHS = "January,February,March,April,May,June,July,August,September,October,November,December";

/** Minimal i18n stub — keys resolve to themselves, months_array to the CSV above. */
const t = (key: string, vars?: Record<string, string | number>): string => {
  let out = key === "tools.months_array" ? MONTHS : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replace(`{{${k}}}`, String(v));
  }
  return out;
};

const EMPTY_POCKETS: Pocket[] = [];

function tx(partial: Partial<Transaction> & Pick<Transaction, "id" | "amount" | "type">): Transaction {
  return {
    timestamp: Date.now(),
    merchant: "Merchant",
    category: "General",
    payment_method: "Cash",
    note: "",
    ...partial,
  } as Transaction;
}

const OCT_2026 = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();

describe("prepareReportData", () => {
  it("excludes pocket transfers from overall totals but includes them in detail transactions", () => {
    const data = prepareReportData(
      [
        tx({ id: "1", amount: 100_000, type: "expense", category: "Food", timestamp: OCT_2026(1) }),
        tx({ id: "2", amount: 50_000, type: "expense", category: "Pindah Saldo", timestamp: OCT_2026(2) }),
        tx({ id: "3", amount: 75_000, type: "income", category: "Salary", timestamp: OCT_2026(3), transferId: "t1" }),
      ],
      10,
      2026,
      t,
      EMPTY_POCKETS
    );
    // Overall aggregates exclude transfers
    expect(data.expenseAgg.total).toBe(100_000);
    expect(data.incomeAgg.total).toBe(0);
    expect(data.net).toBe(-100_000);
    expect(data.expenseAgg.byCategory).toEqual({ Food: 100_000 });
    // But transactions array includes transfers for detail table
    expect(data.transactions).toHaveLength(3);
  });

  it("buckets daily expenses per day-of-month and the buckets sum to the expense total", () => {
    const data = prepareReportData(
      [
        tx({ id: "1", amount: 30_000, type: "expense", timestamp: OCT_2026(1) }),
        tx({ id: "2", amount: 50_000, type: "expense", timestamp: OCT_2026(15) }),
        tx({ id: "3", amount: 20_000, type: "expense", timestamp: OCT_2026(31) }),
        tx({ id: "4", amount: 999, type: "income", timestamp: OCT_2026(10) }),
      ],
      10,
      2026,
      t,
      EMPTY_POCKETS
    );
    expect(data.dailyExpense).toHaveLength(31);
    expect(data.dailyExpense[0]).toBe(30_000);
    expect(data.dailyExpense[14]).toBe(50_000);
    expect(data.dailyExpense[30]).toBe(20_000);
    expect(data.dailyExpense.reduce((a, b) => a + b, 0)).toBe(data.expenseAgg.total);
  });

  it("returns top-5 expenses sorted by amount descending", () => {
    const amounts = [10, 50, 30, 80, 20, 90, 40, 60, 70, 5];
    const data = prepareReportData(
      amounts.map((amount, i) => tx({ id: String(i), amount, type: "expense", timestamp: OCT_2026(i + 1) })),
      10,
      2026,
      t,
      EMPTY_POCKETS
    );
    expect(data.topExpenses).toHaveLength(5);
    expect(data.topExpenses.map((tx) => tx.amount)).toEqual([90, 80, 70, 60, 50]);
  });

  it("sorts transactions newest-first and computes period strings for October 2026", () => {
    const data = prepareReportData(
      [
        tx({ id: "1", amount: 1, type: "expense", timestamp: OCT_2026(5) }),
        tx({ id: "2", amount: 2, type: "expense", timestamp: OCT_2026(20) }),
      ],
      10,
      2026,
      t,
      EMPTY_POCKETS
    );
    expect(data.transactions.map((tx) => tx.id)).toEqual(["2", "1"]);
    expect(data.monthName).toBe("October");
    expect(data.periodStart).toBe("1 October 2026");
    expect(data.periodEnd).toBe("31 October 2026");
  });
});

describe("buildMonthlyReportPdf", () => {
  it("builds a single page for a small month without throwing", async () => {
    const doc = await buildMonthlyReportPdf(
      [
        tx({ id: "1", amount: 100_000, type: "income", category: "Salary", timestamp: OCT_2026(1) }),
        tx({ id: "2", amount: 40_000, type: "expense", category: "Food", timestamp: OCT_2026(2) }),
      ],
      10,
      2026,
      t,
      EMPTY_POCKETS
    );
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("handles an empty month (zero transactions) without throwing", async () => {
    const doc = await buildMonthlyReportPdf([], 10, 2026, t, EMPTY_POCKETS);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("spills the transaction detail table onto extra pages for a long month", async () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      tx({ id: String(i), amount: 1_000 + i, type: i % 2 === 0 ? "expense" : "income", timestamp: OCT_2026((i % 31) + 1) })
    );
    const doc = await buildMonthlyReportPdf(many, 10, 2026, t, EMPTY_POCKETS);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
