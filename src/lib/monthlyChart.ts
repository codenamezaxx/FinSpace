/**
 * Compute monthly income and net worth data for charting.
 */
import type { Transaction } from "./db";
import type { AssetEntry, LiabilityEntry, DebtEntry } from "./netWorth";

export interface MonthlyDataPoint {
  month: string;
  value: number;
}

export type CashFlowRange = "day" | "week" | "month" | "year";

export interface CashFlowDataPoint {
  label: string;
  income: number;
  expense: number;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function endOfDay(d: Date): number {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  ).getTime();
}

/** Monday (00:00) of the week containing `d`. */
function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

/**
 * Compute income vs expense buckets for a cash-flow chart.
 * - day: last 14 days (daily buckets)
 * - week: last 12 weeks (Monday–Sunday buckets)
 * - month: last 12 months
 * - year: last 5 years
 * Pocket transfers are excluded from both series.
 */
export function computeCashFlow(
  transactions: Transaction[],
  range: CashFlowRange
): CashFlowDataPoint[] {
  const now = new Date();
  const buckets: Array<{ label: string; start: number; end: number }> = [];

  if (range === "day") {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      );
      buckets.push({
        label: d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        start: startOfDay(d),
        end: endOfDay(d),
      });
    }
  } else if (range === "week") {
    const thisMonday = startOfWeekMonday(now);
    for (let i = 11; i >= 0; i--) {
      const start = new Date(
        thisMonday.getFullYear(),
        thisMonday.getMonth(),
        thisMonday.getDate() - i * 7
      );
      const end = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + 6,
        23,
        59,
        59,
        999
      );
      buckets.push({
        label: `${start.getDate()}/${start.getMonth() + 1}`,
        start: start.getTime(),
        end: end.getTime(),
      });
    }
  } else if (range === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleDateString("id-ID", { month: "short" }),
        start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
        end: new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        ).getTime(),
      });
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      buckets.push({
        label: String(year),
        start: new Date(year, 0, 1).getTime(),
        end: new Date(year, 11, 31, 23, 59, 59, 999).getTime(),
      });
    }
  }

  return buckets.map(({ label, start, end }) => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.transferId || t.timestamp < start || t.timestamp > end) continue;
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { label, income, expense };
  });
}

/**
 * Compute net worth per month for the past 12 months.
 * Uses `createdAt` on AssetEntry/LiabilityEntry/DebtEntry to determine
 * which items existed in each month. Items without `createdAt`
 * (pre-feature data for assets/liabilities) are included in all months.
 * Calculates cumulative cash balance from income/expense transactions.
 */
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  transactions: Transaction[],
  debts: DebtEntry[],
): MonthlyDataPoint[] {
  const now = new Date();
  const result: MonthlyDataPoint[] = [];
  let cumulativeBalance = 0;

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

    // Calculate income and expense for this month
    const monthIncome = transactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.timestamp >= startOfMonth &&
          t.timestamp <= endOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.timestamp >= startOfMonth &&
          t.timestamp <= endOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Update cumulative balance
    cumulativeBalance += monthIncome - monthExpense;

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
      value: cumulativeBalance + assetsUpTo - liabilitiesUpTo - debtsUpTo,
    });
  }

  return result;
}

/**
 * Compact Y-axis labels: 1.7jt / 8jt / 10rb / 999 / 0.
 * No trailing ".0" so ticks stay unambiguous at small sizes.
 */
export function formatChartYAxis(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number) => String(Number(n.toFixed(1)));
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)}M`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}jt`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(Math.round(value));
}
