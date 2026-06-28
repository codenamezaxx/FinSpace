/**
 * Compute monthly income and net worth data for charting.
 */
import type { Transaction } from "./db";
import type { AssetEntry, LiabilityEntry, DebtEntry } from "./netWorth";

export interface MonthlyDataPoint {
  month: string;
  value: number;
}

/**
 * Compute income per month for the past 12 months.
 */
export function computeMonthlyIncome(
  transactions: Transaction[]
): MonthlyDataPoint[] {
  const now = new Date();
  const result: MonthlyDataPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("id-ID", { month: "short" });
    const startOfMonth = new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    ).getTime();
    const endOfMonth = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();

    const income = transactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.timestamp >= startOfMonth &&
          t.timestamp <= endOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({ month: monthLabel, value: income });
  }

  return result;
}

/**
 * Compute net worth per month for the past 12 months.
 * Uses `createdAt` on AssetEntry/LiabilityEntry/DebtEntry to determine
 * which items existed in each month. Items without `createdAt`
 * (pre-feature data for assets/liabilities) are included in all months.
 * Uses current balance as the default for all months (no per-month history).
 */
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  balance: number,
  debts: DebtEntry[],
): MonthlyDataPoint[] {
  const now = new Date();
  const result: MonthlyDataPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("id-ID", { month: "short" });
    const endOfMonth = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();

    const assetsUpTo = assets
      .filter((a) => (a.createdAt ?? 0) <= endOfMonth)
      .reduce((sum, a) => sum + a.amount, 0);

    const liabilitiesUpTo = liabilities
      .filter((l) => (l.createdAt ?? 0) <= endOfMonth)
      .reduce((sum, l) => sum + l.amount, 0);

    const debtsUpTo = debts
      .filter((d) => d.createdAt <= endOfMonth)
      .reduce((sum, d) => {
        const paid = d.createdAt <= endOfMonth ? d.paidAmount : 0;
        return sum + Math.max(0, d.totalAmount - paid);
      }, 0);

    result.push({
      month: monthLabel,
      value: balance + assetsUpTo - liabilitiesUpTo - debtsUpTo,
    });
  }

  return result;
}
