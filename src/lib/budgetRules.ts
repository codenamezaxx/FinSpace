export type BudgetCategory = "needs" | "wants" | "savings";

export interface BudgetAllocation {
  needs: number;
  wants: number;
  savings: number;
}

export interface BudgetStatus {
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
}

export const CATEGORY_MAPPING: Record<string, BudgetCategory> = {
  // Needs (50%)
  "Makanan & Minuman": "needs",
  Transportasi: "needs",
  Tagihan: "needs",
  Kesehatan: "needs",
  Pendidikan: "needs",
  // Wants (30%)
  Belanja: "wants",
  Hiburan: "wants",
  // Savings (20%)
  Gaji: "savings",
  Freelance: "savings",
  Investasi: "savings",
};

/**
 * Calculate 50/30/20 budget allocation from total monthly income.
 */
export function calculateBudgetAllocation(totalIncome: number): BudgetAllocation {
  return {
    needs: Math.round(totalIncome * 0.5),
    wants: Math.round(totalIncome * 0.3),
    savings: Math.round(totalIncome * 0.2),
  };
}

/**
 * Determine which budget bucket a category falls into.
 */
export function getBudgetCategory(category: string): BudgetCategory {
  return CATEGORY_MAPPING[category] ?? "wants";
}

/**
 * Check spending status against a budget allocation.
 */
export function checkBudgetStatus(
  spent: number,
  allocated: number
): BudgetStatus {
  const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  return {
    percentage: Math.min(percentage, 100),
    remaining: Math.max(allocated - spent, 0),
    isOverBudget: spent > allocated,
  };
}

/**
 * Categorize an expense amount into the 50/30/20 buckets.
 */
export function categorizeExpense(category: string): BudgetCategory {
  return getBudgetCategory(category);
}
