/**
 * Pure utility functions for debt calculations.
 */

import type { DebtEntry } from "./netWorth";

export interface InstallmentResult {
  period: "bulan" | "minggu";
  amount: number;
  count: number;
  overdue: boolean;
}

/**
 * Calculate straight-line installment for a debt.
 * - If >= 30 days remaining → monthly installment
 * - If < 30 days and > 0 → weekly installment
 * - If overdue → { overdue: true }
 */
export function calcInstallment(
  remainingAmount: number,
  dueDate: number
): InstallmentResult {
  const now = Date.now();
  const msRemaining = dueDate - now;

  if (msRemaining <= 0) {
    return { period: "bulan", amount: 0, count: 0, overdue: true };
  }

  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

  if (daysRemaining >= 30) {
    const months = Math.ceil(daysRemaining / 30);
    return {
      period: "bulan",
      amount: Math.round(remainingAmount / months),
      count: months,
      overdue: false,
    };
  }

  const weeks = Math.max(1, Math.ceil(daysRemaining / 7));
  return {
    period: "minggu",
    amount: Math.round(remainingAmount / weeks),
    count: weeks,
    overdue: false,
  };
}

/** Compute remaining amount (total - paid). Never negative. */
export function remainingAmount(debt: DebtEntry): number {
  return Math.max(0, debt.totalAmount - debt.paidAmount);
}
