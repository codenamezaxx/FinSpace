/**
 * Pure utility functions for debt calculations.
 */

import type { DebtEntry } from "./netWorth";

export interface InstallmentResult {
  period: "bulan" | "minggu";
  amount: number;
  count: number;
  overdue: boolean;
  /** Total interest accrued over the loan period (simple interest). */
  interestTotal?: number;
}

/**
 * Calculate straight-line installment for a debt, with optional simple interest.
 * - If >= 30 days remaining → monthly installment
 * - If < 30 days and > 0 → weekly installment
 * - If overdue → { overdue: true }
 *
 * When interestRate is provided, simple interest is computed as:
 *   totalInterest = principal * (annualRate/100) * (tenorInDays / 365)
 *   installment  = (principal + totalInterest) / numberOfPayments
 */
export function calcInstallment(
  remainingAmount: number,
  dueDate: number,
  interestRate?: number
): InstallmentResult {
  const now = Date.now();
  const msRemaining = dueDate - now;

  if (msRemaining <= 0) {
    return { period: "bulan", amount: 0, count: 0, overdue: true };
  }

  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

  const count =
    daysRemaining >= 30
      ? Math.ceil(daysRemaining / 30) // months
      : Math.max(1, Math.ceil(daysRemaining / 7)); // weeks

  // Calculate simple interest if rate is provided
  let totalOwed = remainingAmount;
  let interestTotal: number | undefined;

  if (interestRate && interestRate > 0) {
    const tenorYears = daysRemaining / 365;
    const totalInterest = Math.round(
      remainingAmount * (interestRate / 100) * tenorYears
    );
    totalOwed = remainingAmount + totalInterest;
    interestTotal = totalInterest;
  }

  return {
    period: daysRemaining >= 30 ? "bulan" : "minggu",
    amount: Math.round(totalOwed / count),
    count,
    overdue: false,
    interestTotal,
  };
}

/** Compute remaining amount (total - paid). Never negative. */
export function remainingAmount(debt: DebtEntry): number {
  return Math.max(0, debt.totalAmount - debt.paidAmount);
}

/**
 * Calculate the monthly debt obligation for a single debt.
 * Used for Debt-to-Income ratio (PRD §3 Modul C).
 *
 * - Overdue debts → full remaining amount (assumed due immediately).
 * - Monthly installment → amount per month.
 * - Weekly installment → normalized to monthly (× 30/7).
 * - Includes simple interest when interestRate is set.
 */
export function calculateMonthlyDebtObligation(debt: DebtEntry): number {
  const remaining = remainingAmount(debt);
  if (remaining <= 0) return 0;

  const installment = calcInstallment(remaining, debt.dueDate, debt.interestRate);

  // Overdue: assume full remaining is the monthly burden
  if (installment.overdue) return remaining;

  // Monthly: use as-is
  if (installment.period === "bulan") return installment.amount;

  // Weekly: normalize to monthly
  return Math.round(installment.amount * (30 / 7));
}

/**
 * Calculate total monthly debt obligation across all debts.
 */
export function totalMonthlyDebtObligation(debts: DebtEntry[]): number {
  return debts.reduce((sum, d) => sum + calculateMonthlyDebtObligation(d), 0);
}
