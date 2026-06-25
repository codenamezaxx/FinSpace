import type { NetWorthResult } from "./netWorth";

export interface FinancialRatios {
  liquidityRatio: number;
  savingsRate: number;
  debtToIncome: number;
}

export type HealthStatus = "safe" | "warning" | "danger";

/**
 * Rasio Likuiditas = Aset Likuid / Pengeluaran Bulanan
 * Aman jika ≥ 3 bulan.
 */
export function calculateLiquidityRatio(
  liquidAssets: number,
  monthlyExpenses: number
): number {
  if (monthlyExpenses <= 0) return 0;
  return Math.round((liquidAssets / monthlyExpenses) * 10) / 10;
}

/**
 * Rasio Tabungan = (Tabungan Bulanan / Pendapatan Bulanan) × 100%
 * Sehat jika ≥ 20%.
 */
export function calculateSavingsRate(
  totalMonthlySavings: number,
  monthlyIncome: number
): number {
  if (monthlyIncome <= 0) return 0;
  return Math.round((totalMonthlySavings / monthlyIncome) * 100);
}

/**
 * Rasio Utang = (Total Cicilan Utang / Pendapatan Bulanan) × 100%
 * Aman jika < 30%.
 */
export function calculateDebtToIncome(
  totalMonthlyDebt: number,
  monthlyIncome: number
): number {
  if (monthlyIncome <= 0) return 0;
  return Math.round((totalMonthlyDebt / monthlyIncome) * 100);
}

/**
 * Calculate all three ratios at once.
 */
export function calculateAllRatios(
  liquidAssets: number,
  monthlyExpenses: number,
  monthlyIncome: number,
  totalMonthlyDebt: number
): FinancialRatios {
  return {
    liquidityRatio: calculateLiquidityRatio(liquidAssets, monthlyExpenses),
    savingsRate: calculateSavingsRate(
      Math.max(0, monthlyIncome - monthlyExpenses),
      monthlyIncome
    ),
    debtToIncome: calculateDebtToIncome(totalMonthlyDebt, monthlyIncome),
  };
}

// Health status helpers

export function getLiquidityStatus(ratio: number): HealthStatus {
  if (ratio >= 3) return "safe";
  if (ratio >= 1) return "warning";
  return "danger";
}

export function getSavingsRateStatus(rate: number): HealthStatus {
  if (rate >= 20) return "safe";
  if (rate >= 10) return "warning";
  return "danger";
}

export function getDebtToIncomeStatus(ratio: number): HealthStatus {
  if (ratio < 30) return "safe";
  if (ratio < 40) return "warning";
  return "danger";
}

export function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case "safe":
      return "#22c55e";
    case "warning":
      return "#FFCF95";
    case "danger":
      return "#ef4444";
  }
}

export function getStatusLabel(status: HealthStatus, bahasa = false): string {
  if (bahasa) {
    switch (status) {
      case "safe": return "Aman";
      case "warning": return "Waspada";
      case "danger": return "Bahaya";
    }
  }
  switch (status) {
    case "safe": return "Safe";
    case "warning": return "Warning";
    case "danger": return "Danger";
  }
}
