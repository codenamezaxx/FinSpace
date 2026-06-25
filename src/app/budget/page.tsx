"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { TransactionList } from "@/components/shared/TransactionList";
import { AddTransactionForm } from "@/components/budget/AddTransactionForm";
import { BudgetRing } from "@/components/budget/BudgetRing";
import { useTransactions } from "@/hooks/useTransactions";
import {
  calculateBudgetAllocation,
  checkBudgetStatus,
  CATEGORY_MAPPING,
} from "@/lib/budgetRules";

export default function BudgetPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const { transactions } = useTransactions({ startTime: startOfMonth });

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const allocation = useMemo(() => calculateBudgetAllocation(monthlyIncome), [monthlyIncome]);

  const spending = useMemo(() => {
    const monthlyExpenses = transactions.filter(
      (t) => t.type === "expense"
    );

    let needs = 0;
    let wants = 0;

    for (const tx of monthlyExpenses) {
      const bucket = CATEGORY_MAPPING[tx.category] || "wants";
      if (bucket === "needs") needs += tx.amount;
      else wants += tx.amount;
    }

    return { needs, wants };
  }, [transactions]);

  const needsStatus = checkBudgetStatus(spending.needs, allocation.needs);
  const wantsStatus = checkBudgetStatus(spending.wants, allocation.wants);
  const totalSaved = monthlyIncome - spending.needs - spending.wants;
  const savingsStatus = checkBudgetStatus(
    Math.max(0, allocation.savings - totalSaved),
    allocation.savings
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Budget &amp; Cashflow
          </h1>
          <p className="text-sm text-text-muted">
            Monthly income:{" "}
            <span className="font-mono font-semibold text-success">
              {formatCurrency(monthlyIncome)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* 50/30/20 Budget Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Needs (50%) */}
        <div className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={needsStatus.percentage}
            label="Needs (50%)"
            sublabel={`Spent ${formatCurrency(spending.needs)}`}
            remaining={
              needsStatus.isOverBudget
                ? `Over by ${formatCurrency(Math.abs(needsStatus.remaining))}`
                : `${formatCurrency(needsStatus.remaining)} remaining`
            }
            isOverBudget={needsStatus.isOverBudget}
          />
        </div>

        {/* Wants (30%) */}
        <div className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={wantsStatus.percentage}
            label="Wants (30%)"
            sublabel={`Spent ${formatCurrency(spending.wants)}`}
            remaining={
              wantsStatus.isOverBudget
                ? `Over by ${formatCurrency(Math.abs(wantsStatus.remaining))}`
                : `${formatCurrency(wantsStatus.remaining)} remaining`
            }
            isOverBudget={wantsStatus.isOverBudget}
          />
        </div>

        {/* Savings (20%) */}
        <div className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={savingsStatus.percentage}
            label="Savings (20%)"
            sublabel={`Saved ${formatCurrency(totalSaved)}`}
            remaining={
              totalSaved >= allocation.savings
                ? `${formatCurrency(totalSaved - allocation.savings)} surplus`
                : `${formatCurrency(Math.max(0, allocation.savings - totalSaved))} to goal`
            }
            isOverBudget={totalSaved < allocation.savings}
          />
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-primary">
          Recent Transactions
        </h2>
        <TransactionList />
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
      />
    </div>
  );
}
