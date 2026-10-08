"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Settings, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { TransactionList } from "@/components/shared/TransactionList";
import { BudgetRing } from "@/components/budget/BudgetRing";
import { CATEGORY_CONFIG } from "@/components/budget/PocketCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionModal } from "@/lib/transaction-modal-context";
import {
  calculateBudgetAllocation,
  checkBudgetStatus,
  getBudgetCategory,
} from "@/lib/budgetRules";
import { usePockets } from "@/hooks/usePockets";
import { BudgetSettingsModal } from "@/components/budget/BudgetSettingsModal";
import { formatCurrency } from "@/lib/netWorth";

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 font-mono text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export default function BudgetPage() {
  const { t } = useLanguage();
  const { openAddTransaction } = useTransactionModal();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const { transactions } = useTransactions({ startTime: startOfMonth });
  const { pockets, balances } = usePockets();

  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [customAllocation, setCustomAllocation] = useState<{ needs: number; wants: number; savings: number } | null>(null);

  // Load custom allocation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("finspace-budget-allocation");
    if (saved) {
      try { setCustomAllocation(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const handleSaveBudget = useCallback((allocation: { needs: number; wants: number; savings: number }) => {
    localStorage.setItem("finspace-budget-allocation", JSON.stringify(allocation));
    setCustomAllocation(allocation);
    setShowBudgetSettings(false);
  }, []);

  const monthlyIncome = useMemo(() => {
    return transactions
      // Transfers excluded: moving money between pockets is not income
      .filter((t) => t.type === "income" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Active budget percentages (custom or 50/30/20 default) — drives ring labels
  const pct = customAllocation ?? { needs: 50, wants: 30, savings: 20 };

  const allocation = useMemo(() => {
    if (customAllocation) {
      return {
        needs: Math.round((monthlyIncome * customAllocation.needs) / 100),
        wants: Math.round((monthlyIncome * customAllocation.wants) / 100),
        savings: Math.round((monthlyIncome * customAllocation.savings) / 100),
      };
    }
    return calculateBudgetAllocation(monthlyIncome);
  }, [monthlyIncome, customAllocation]);

  const spending = useMemo(() => {
    const monthlyExpenses = transactions.filter(
      (tx) => tx.type === "expense" && !tx.transferId
    );

    let needs = 0;
    let wants = 0;

    for (const tx of monthlyExpenses) {
      const bucket = getBudgetCategory(tx.category);
      if (bucket === "needs") needs += tx.amount;
      else if (bucket === "wants") wants += tx.amount;
      // "savings"-bucket expenses are relocations, not consumption — excluded
    }

    return { needs, wants };
  }, [transactions]);

  const needsStatus = checkBudgetStatus(spending.needs, allocation.needs);
  const wantsStatus = checkBudgetStatus(spending.wants, allocation.wants);

  // Savings deposits: any non-transfer transaction (income or expense)
  // in the canonical Tabungan category counts as money set aside.
  // Legacy categories never auto-fill the ring — only explicit Tabungan does.
  const savingsDeposits = useMemo(() => {
    return transactions
      .filter((t) => !t.transferId && t.category === "Tabungan")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  const savingsStatus = checkBudgetStatus(savingsDeposits, allocation.savings);
  const savingsComplete = allocation.savings > 0 && savingsDeposits >= allocation.savings;

  return (
    <div className="space-y-8 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("budget.title")}
          </h1>
          <p className="text-sm text-text-muted">
            {t("budget.this_month")}:{" "}
            <span className="font-mono font-semibold text-success">
              {formatCurrency(monthlyIncome)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBudgetSettings(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-surface-alt hover:text-text-primary"
            aria-label={t("budget.settings_title")}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t("budget.settings_title")}</span>
          </button>
          <button
            onClick={() => openAddTransaction()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {t("nav.add_transaction")}
          </button>
        </div>
      </div>

      {/* 50/30/20 Budget Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Needs */}
        <div className="glass min-w-0 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={needsStatus.percentage}
            label={`${t("budget.needs")} (${pct.needs}%)`}
            sublabel={`${t("budget.spent")} ${formatCurrency(spending.needs)}`}
            remaining={
              needsStatus.isOverBudget
                ? t("budget.over_by", { amount: formatCurrency(Math.abs(needsStatus.remaining)) })
                : `${formatCurrency(needsStatus.remaining)} ${t("budget.remaining")}`
            }
            isOverBudget={needsStatus.isOverBudget}
          />
        </div>

        {/* Wants */}
        <div className="glass min-w-0 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={wantsStatus.percentage}
            label={`${t("budget.wants")} (${pct.wants}%)`}
            sublabel={`${t("budget.spent")} ${formatCurrency(spending.wants)}`}
            remaining={
              wantsStatus.isOverBudget
                ? t("budget.over_by", { amount: formatCurrency(Math.abs(wantsStatus.remaining)) })
                : `${formatCurrency(wantsStatus.remaining)} ${t("budget.remaining")}`
            }
            isOverBudget={wantsStatus.isOverBudget}
          />
        </div>

        {/* Savings */}
        <div className="glass min-w-0 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={savingsStatus.percentage}
            label={`${t("budget.savings")} (${pct.savings}%)`}
            sublabel={`${t("budget.saved")} ${formatCurrency(savingsDeposits)}`}
            remaining={
              savingsComplete
                ? t("budget.savings_complete")
                : t("budget.toward_target", { amount: formatCurrency(Math.max(0, allocation.savings - savingsDeposits)) })
            }
            isOverBudget={false}
            metSavingsGoal={savingsComplete}
          />
        </div>
      </div>

      {/* Pockets — balances only, management lives in the subpage */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="truncate text-lg font-semibold text-primary">
            {t("budget.pockets_title")}
          </h2>
          <ViewAllLink href="/budget/pockets" label={t("budget.manage_pockets")} />
        </div>
        {pockets.length === 0 ? (
          <p className="font-mono text-sm italic text-text-secondary/70">
            {t("budget.no_pockets")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pockets.map((p) => {
              const config = CATEGORY_CONFIG[p.category] ?? CATEGORY_CONFIG.tunai;
              const Icon = config.icon;
              return (
                <div
                  key={p.id}
                  className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-border/60 bg-surface-alt/40 px-3 py-3 sm:px-4"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.tint}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-text-secondary sm:text-sm">
                      {p.name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-sm font-bold text-text-primary sm:text-base">
                      {formatCurrency(balances[p.id] ?? 0)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions (latest 10, view-only) */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="truncate text-lg font-semibold text-primary">
            {t("budget.recent_transactions")}
          </h2>
          <ViewAllLink
            href="/budget/transactions"
            label={t("budget.view_all_transactions")}
          />
        </div>
        <TransactionList pockets={pockets} compact limit={10} />
      </div>

      <BudgetSettingsModal
        isOpen={showBudgetSettings}
        onClose={() => setShowBudgetSettings(false)}
        totalIncome={monthlyIncome}
        currentAllocation={customAllocation ?? { needs: 50, wants: 30, savings: 20 }}
        onSave={handleSaveBudget}
      />
    </div>
  );
}
