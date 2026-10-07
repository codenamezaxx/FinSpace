"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { NetWorthCard } from "@/components/wealth/NetWorthCard";
import { AssetAllocation } from "@/components/wealth/AssetAllocation";
import { RatioCard } from "@/components/wealth/RatioCard";
import { Speedometer } from "@/components/wealth/Speedometer";
import { DebtForm } from "@/components/wealth/DebtForm";
import { DebtList } from "@/components/wealth/DebtList";
import { AssetRow, LiabilityRow } from "@/components/wealth/WealthLists";
import { useTransactions } from "@/hooks/useTransactions";
import { useWealthData } from "@/hooks/useWealthData";
import { useAssetLiabilityModal } from "@/lib/asset-liability-modal-context";
import { calculateNetWorth, formatCurrency } from "@/lib/netWorth";
import {
  calculateAllRatios,
  calculateHealthScore,
  getLiquidityStatus,
  getSavingsRateStatus,
  getDebtToIncomeStatus,
  scoreToStatus,
} from "@/lib/financialRatios";
import { totalMonthlyDebtObligation, remainingAmount } from "@/lib/debtUtils";
import {
  ArrowRight,
  PiggyBank,
  Plus,
  Wallet,
  TrendingDown,
  Gauge,
} from "lucide-react";
import { usePockets } from "@/hooks/usePockets";
import type { DebtEntry } from "@/lib/netWorth";
import type { HealthStatus } from "@/lib/financialRatios";
import { useLanguage } from "@/lib/i18n";
import { db } from "@/lib/db";

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

export default function WealthPage() {
  const { t } = useLanguage();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  ).getTime();
  const { transactions } = useTransactions({
    startTime: startOfMonth,
    endTime: endOfMonth,
  });
  const { pockets, totalBalance: pocketTotalBalance } = usePockets();
  const { assets, liabilities, debts } = useWealthData();
  const { openAssetLiabilityModal } = useAssetLiabilityModal();
  const { addTransaction } = useTransactions();

  const [showDebtForm, setShowDebtForm] = useState(false);

  const handlePurchase = useCallback(
    (data: { name: string; amount: number; pocketId?: string }) => {
      const pocket =
        pockets.find((p) => p.id === data.pocketId) ??
        pockets.find((p) => p.name === "Tunai");
      addTransaction({
        amount: data.amount,
        type: "expense",
        category: "Pembelian",
        merchant: `Pembelian: ${data.name}`,
        payment_method: pocket?.name ?? "Tunai",
        pocketId: pocket?.id ?? null,
      });
    },
    [addTransaction, pockets]
  );

  const openAddItem = useCallback(
    (defaultType?: "asset" | "liability") => {
      openAssetLiabilityModal({
        defaultType,
        onPurchase: handlePurchase,
        currentBalance: pocketTotalBalance,
      });
    },
    [openAssetLiabilityModal, handlePurchase, pocketTotalBalance]
  );

  const handleAddDebt = useCallback(async (debt: DebtEntry) => {
    await db.debts.put(debt);
  }, []);

  const netWorthData = useMemo(
    () => calculateNetWorth(assets, liabilities, pocketTotalBalance, debts),
    [assets, liabilities, pocketTotalBalance, debts]
  );

  const monthlyData = useMemo(() => {
    // Transfers excluded: moving money between pockets is neither income nor spending
    const income = transactions
      .filter((tx) => tx.type === "income" && !tx.transferId)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = transactions
      .filter((tx) => tx.type === "expense" && !tx.transferId)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const debtPayments = totalMonthlyDebtObligation(debts);

    return { income, expenses, debtPayments };
  }, [transactions, debts]);

  const ratios = useMemo(
    () =>
      calculateAllRatios(
        netWorthData.liquidAssets,
        monthlyData.expenses,
        monthlyData.income,
        monthlyData.debtPayments
      ),
    [netWorthData.liquidAssets, monthlyData]
  );

  const healthScore = useMemo(() => calculateHealthScore(ratios), [ratios]);

  // Same source of truth as the dashboard ring: status derives from the
  // composite score (≥70 safe, ≥40 warning) — never from the worst ratio.
  const overallStatus: HealthStatus = useMemo(
    () => scoreToStatus(healthScore),
    [healthScore]
  );

  // Overview shows only the 3 largest of each — full management lives in subpages
  const topAssets = useMemo(
    () => [...assets].sort((a, b) => b.amount - a.amount).slice(0, 3),
    [assets]
  );
  const topLiabilities = useMemo(
    () => [...liabilities].sort((a, b) => b.amount - a.amount).slice(0, 3),
    [liabilities]
  );
  const topDebts = useMemo(
    () =>
      [...debts]
        .sort((a, b) => remainingAmount(a) - remainingAmount(b))
        .slice(0, 3),
    [debts]
  );

  return (
    <div className="space-y-6 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-text-primary">{t("wealth.title")}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {t("wealth.financial_health")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddItem()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {t("wealth.add_item")}
        </button>
      </div>

      {/* Net Worth Card */}
      <NetWorthCard
        totalBalance={netWorthData.totalBalance}
        totalAssets={netWorthData.totalAssets}
        totalLiabilities={netWorthData.totalLiabilities}
        totalDebts={netWorthData.totalDebts}
        netWorth={netWorthData.netWorth}
      />

      {/* Asset Allocation */}
      <AssetAllocation assets={assets} />

      {/* Assets & Liabilities Top 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("wealth.total_assets")}
            </h3>
            <ViewAllLink href="/wealth/assets" label={t("wealth.view_all")} />
          </div>
          <div className="space-y-2">
            {assets.length === 0 ? (
              <div>
                <p className="font-mono text-sm italic text-text-secondary/70">
                  {t("wealth.no_assets_yet")}
                </p>
                <button
                  type="button"
                  onClick={() => openAddItem("asset")}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  {t("wealth.add_item")}
                </button>
              </div>
            ) : (
              topAssets.map((asset) => <AssetRow key={asset.id} asset={asset} />)
            )}
          </div>
        </div>

        {/* Liabilities */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("wealth.total_liabilities")}
            </h3>
            <ViewAllLink href="/wealth/assets" label={t("wealth.view_all")} />
          </div>
          <div className="space-y-2">
            {liabilities.length === 0 ? (
              <div>
                <p className="font-mono text-sm italic text-text-secondary/70">
                  {t("wealth.no_liabilities_yet")}
                </p>
                <button
                  type="button"
                  onClick={() => openAddItem("liability")}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  {t("wealth.add_item")}
                </button>
              </div>
            ) : (
              topLiabilities.map((liability) => (
                <LiabilityRow key={liability.id} liability={liability} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Debts Top 3 */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t("wealth.total_debts")}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-text-muted">
              {debts.length} · {formatCurrency(netWorthData.totalDebts)}
            </p>
          </div>
          <ViewAllLink href="/wealth/debts" label={t("wealth.view_all")} />
        </div>
        <DebtList debts={topDebts} onAdd={() => setShowDebtForm(true)} />
      </div>

      <DebtForm
        isOpen={showDebtForm}
        onClose={() => setShowDebtForm(false)}
        onSave={handleAddDebt}
      />

      {/* Financial Health Ratios */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Gauge className="h-5 w-5 text-accent-secondary" />
          {t("wealth.financial_health_ratios")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RatioCard
            title={t("financial.liquidity_ratio")}
            value={`${ratios.liquidityRatio}x`}
            description={t("wealth.liquidity_ratio_desc")}
            status={getLiquidityStatus(ratios.liquidityRatio)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <RatioCard
            title={t("financial.savings_rate")}
            value={`${ratios.savingsRate}%`}
            description={t("wealth.savings_rate_desc")}
            status={getSavingsRateStatus(ratios.savingsRate)}
            icon={<PiggyBank className="h-4 w-4" />}
          />
          <RatioCard
            title={t("financial.debt_to_income")}
            value={`${ratios.debtToIncome}%`}
            description={t("wealth.debt_ratio_desc")}
            status={getDebtToIncomeStatus(ratios.debtToIncome)}
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Speedometer */}
      <div className="glass flex flex-col items-center rounded-2xl p-6">
        <h2 className="mb-2 font-mono text-lg font-semibold text-text-primary">
          {t("wealth.health_score")}
        </h2>
        <Speedometer
          value={healthScore}
          label={t("wealth.financial_health")}
          status={overallStatus}
        />
      </div>
    </div>
  );
}
