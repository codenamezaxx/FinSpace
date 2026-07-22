export interface AssetEntry {
  id: string;
  name: string;
  amount: number;
  type: "liquid" | "investment" | "property" | "other";
  createdAt?: number; // Unix ms — set when entry is created, used for history
}

export interface LiabilityEntry {
  id: string;
  name: string;
  amount: number;
  createdAt?: number; // Unix ms
}

export interface DebtEntry {
  id: string;
  name: string;
  totalAmount: number;
  dueDate: number;
  paidAmount: number;
  interestRate?: number; // annual interest rate in %, e.g. 5 for 5%
  createdAt: number;
}

export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  totalBalance: number;
  totalDebts: number;
  liquidAssets: number;
  netWorth: number;
}

export function calculateNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  balance: number,
  debts: DebtEntry[]
): NetWorthResult {
  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalDebts = debts.reduce(
    (sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount),
    0
  );
  const liquidAssets = assets
    .filter((a) => a.type === "liquid")
    .reduce((sum, a) => sum + a.amount, 0);

  return {
    totalAssets,
    totalLiabilities,
    totalBalance: balance,
    totalDebts,
    liquidAssets,
    netWorth: balance + totalAssets - totalLiabilities - totalDebts,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a raw digit string for display with dot separators (Indonesian convention).
 * "10000" → "10.000", "" → ""
 */
export function formatInputValue(raw: string): string {
  if (!raw) return "";
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Parse a formatted input string back to raw digits.
 * "10.000" → "10000", "Rp 10.000" → "10000"
 */
export function parseInputValue(formatted: string): string {
  return formatted.replace(/[^0-9]/g, "");
}
