"use client";

import { useState, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { NetWorthCard } from "@/components/wealth/NetWorthCard";
import { RatioCard } from "@/components/wealth/RatioCard";
import { Speedometer } from "@/components/wealth/Speedometer";
import { DebtForm } from "@/components/wealth/DebtForm";
import { PayDebtModal } from "@/components/wealth/PayDebtModal";
import { DebtList } from "@/components/wealth/DebtList";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateNetWorth, formatCurrency } from "@/lib/netWorth";
import { useAssetLiabilityModal } from "@/lib/asset-liability-modal-context";
import {
  calculateAllRatios,
  calculateHealthScore,
  getLiquidityStatus,
  getSavingsRateStatus,
  getDebtToIncomeStatus,
} from "@/lib/financialRatios";
import { totalMonthlyDebtObligation } from "@/lib/debtUtils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Plus,
  Trash2,
  PiggyBank,
  Wallet,
  TrendingDown,
  Gauge,
} from "lucide-react";
import { usePockets } from "@/hooks/usePockets";
import type { AssetEntry, LiabilityEntry, DebtEntry } from "@/lib/netWorth";
import type { HealthStatus } from "@/lib/financialRatios";
import { useLanguage } from "@/lib/i18n";

export default function WealthPage() {
  const { t } = useLanguage();
  const { openAssetLiabilityModal } = useAssetLiabilityModal();
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();
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
  const { addTransaction } = useTransactions();
  const { totalBalance: pocketTotalBalance } = usePockets();

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtEntry | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<AssetEntry | null>(null);
  const [liabilityToDelete, setLiabilityToDelete] =
    useState<LiabilityEntry | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<DebtEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? [];
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), []) ?? [];
  const debts = useLiveQuery(() => db.debts.toArray(), []) ?? [];

  const netWorthData = useMemo(
    () => calculateNetWorth(assets, liabilities, pocketTotalBalance, debts),
    [assets, liabilities, pocketTotalBalance, debts]
  );

  const monthlyData = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = transactions
      .filter((tx) => tx.type === "expense")
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

  const overallStatus: HealthStatus = useMemo(() => {
    const statuses = [
      getLiquidityStatus(ratios.liquidityRatio),
      getSavingsRateStatus(ratios.savingsRate),
      getDebtToIncomeStatus(ratios.debtToIncome),
    ];
    if (statuses.some((s) => s === "danger")) return "danger";
    if (statuses.some((s) => s === "warning")) return "warning";
    return "safe";
  }, [ratios]);

  const handleAddDebt = useCallback(
    async (debt: DebtEntry) => {
      await db.debts.put(debt);
    },
    []
  );

  const handlePayDebt = useCallback(
    async (debtId: string, amount: number, debtName: string) => {
      const debt = await db.debts.get(debtId);
      if (debt) {
        await db.debts.put({
          ...debt,
          paidAmount: (debt.paidAmount || 0) + amount,
        });
      }
      addTransaction({
        amount,
        type: "expense",
        category: "Cicilan",
        merchant: debtName,
        payment_method: "Tunai",
      });
    },
    [addTransaction]
  );

  const handleDeleteDebt = useCallback(
    async (debtId: string) => {
      await db.debts.delete(debtId);
    },
    []
  );

  const handlePurchase = useCallback(
    (data: { name: string; amount: number }) => {
      addTransaction({
        amount: data.amount,
        type: "expense",
        category: "Pembelian",
        merchant: `Pembelian: ${data.name}`,
        payment_method: "Tunai",
      });
    },
    [addTransaction]
  );

  async function removeAsset(id: string) {
    await db.assets.delete(id);
  }

  async function removeLiability(id: string) {
    await db.liabilities.delete(id);
  }

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    setDeleting(true);
    try {
      await removeAsset(assetToDelete.id);
      setAssetToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteLiability = async () => {
    if (!liabilityToDelete) return;
    setDeleting(true);
    try {
      await removeLiability(liabilityToDelete.id);
      setLiabilityToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteDebt = async () => {
    if (!debtToDelete) return;
    setDeleting(true);
    try {
      await handleDeleteDebt(debtToDelete.id);
      setDebtToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("wealth.title")}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {t("wealth.financial_health")}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            openAssetLiabilityModal({
              onPurchase: handlePurchase,
              currentBalance: pocketTotalBalance,
            })
          }
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
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

      {/* Assets & Liabilities Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("wealth.total_assets")}
          </h3>
          <div className="space-y-2">
            {/* Auto: Recorded Balance */}
            <div className="glass flex items-center justify-between rounded-xl border-l-4 border-l-primary p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {t("wealth.recorded_balance")}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {t("wealth.auto_from_transactions")}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-success">
                {formatCurrency(pocketTotalBalance)}
              </span>
            </div>
            {assets.length === 0 ? (
              <p className="font-mono text-sm italic text-text-secondary/70">
                {t("wealth.no_assets_yet")}
              </p>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  className="glass flex items-center justify-between rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {asset.name}
                    </p>
                    <p className="font-mono text-xs capitalize text-text-muted">
                      {asset.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-text-primary">
                      {formatCurrency(asset.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAssetToDelete(asset)}
                      className="text-text-muted transition-colors duration-200 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Liabilities */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("wealth.total_liabilities")}
          </h3>
          {liabilities.length === 0 ? (
            <p className="font-mono text-sm italic text-text-secondary/70">
              {t("wealth.no_liabilities_yet")}
            </p>
          ) : (
            <div className="space-y-2">
              {liabilities.map((liability) => (
                <div
                  key={liability.id}
                  className="glass flex items-center justify-between rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20"
                >
                  <p className="text-sm font-medium text-text-primary">
                    {liability.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-text-primary">
                      {formatCurrency(liability.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLiabilityToDelete(liability)}
                      className="text-text-muted transition-colors duration-200 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Debts ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("wealth.total_debts")}
          </h3>
          <button
            type="button"
            onClick={() => setShowDebtForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-5 py-3 text-sm font-semibold text-primary shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("wealth.add_debt")}
          </button>
        </div>
        <DebtList
          debts={debts}
          onPay={(debt) => setPayingDebt(debt)}
          onDelete={(id) => {
            const debt = debts.find((d) => d.id === id);
            if (debt) setDebtToDelete(debt);
          }}
        />
      </div>

      {/* Modals */}
      <DebtForm
        isOpen={showDebtForm}
        onClose={() => setShowDebtForm(false)}
        onSave={handleAddDebt}
      />
      <PayDebtModal
        isOpen={!!payingDebt}
        debt={payingDebt}
        onClose={() => setPayingDebt(null)}
        onPay={handlePayDebt}
      />

      {/* Delete Confirmation Modals */}
      <ConfirmModal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDeleteAsset}
        title={t("confirm.delete_title")}
        message={t("confirm.delete_message", { item: t("wealth.title") })}
        confirmLabel={t("confirm.confirm")}
        isLoading={deleting}
      />
      <ConfirmModal
        isOpen={!!liabilityToDelete}
        onClose={() => setLiabilityToDelete(null)}
        onConfirm={handleConfirmDeleteLiability}
        title={t("confirm.delete_title")}
        message={t("confirm.delete_message", { item: t("wealth.total_liabilities") })}
        confirmLabel={t("confirm.confirm")}
        isLoading={deleting}
      />
      <ConfirmModal
        isOpen={!!debtToDelete}
        onClose={() => setDebtToDelete(null)}
        onConfirm={handleConfirmDeleteDebt}
        title={t("confirm.delete_title")}
        message={t("confirm.delete_message", { item: t("wealth.total_debts") })}
        confirmLabel={t("confirm.confirm")}
        isLoading={deleting}
      />
    </div>
  );
}
