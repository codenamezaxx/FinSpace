"use client";

import { useState, useEffect, useMemo } from "react";
import { NetWorthCard } from "@/components/wealth/NetWorthCard";
import { RatioCard } from "@/components/wealth/RatioCard";
import { Speedometer } from "@/components/wealth/Speedometer";
import { AssetLiabilityForm } from "@/components/wealth/AssetLiabilityForm";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateNetWorth, formatCurrency } from "@/lib/netWorth";
import {
  calculateAllRatios,
  calculateHealthScore,
  getLiquidityStatus,
  getSavingsRateStatus,
  getDebtToIncomeStatus,
} from "@/lib/financialRatios";
import {
  Plus,
  Trash2,
  PiggyBank,
  Wallet,
  TrendingDown,
  Gauge,
} from "lucide-react";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
import type { HealthStatus } from "@/lib/financialRatios";

const ASSETS_KEY = "finspace_assets";
const LIABILITIES_KEY = "finspace_liabilities";

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function WealthPage() {
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

  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    setAssets(loadFromStorage<AssetEntry>(ASSETS_KEY, []));
    setLiabilities(loadFromStorage<LiabilityEntry>(LIABILITIES_KEY, []));
  }, []);

  function saveAssets(newAssets: AssetEntry[]) {
    setAssets(newAssets);
    localStorage.setItem(ASSETS_KEY, JSON.stringify(newAssets));
  }

  function saveLiabilities(newLiabilities: LiabilityEntry[]) {
    setLiabilities(newLiabilities);
    localStorage.setItem(LIABILITIES_KEY, JSON.stringify(newLiabilities));
  }

  const netWorthData = useMemo(
    () => calculateNetWorth(assets, liabilities),
    [assets, liabilities]
  );

  const monthlyData = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const debtPayments = transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          ["Cicilan", "Utang"].includes(tx.category)
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { income, expenses, debtPayments };
  }, [transactions]);

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

  function handleAddItem(item: AssetEntry | LiabilityEntry) {
    if ("type" in item) {
      saveAssets([...assets, item]);
    } else {
      saveLiabilities([...liabilities, item]);
    }
  }

  function removeAsset(id: string) {
    saveAssets(assets.filter((a) => a.id !== id));
  }

  function removeLiability(id: string) {
    saveLiabilities(liabilities.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Wealth</h1>
          <p className="mt-1 font-mono text-sm text-text-muted">
            Track your net worth and financial health
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Net Worth Card */}
      <NetWorthCard data={netWorthData} />

      {/* Financial Health Ratios */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Gauge className="h-5 w-5 text-accent-secondary" />
          Financial Health Ratios
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RatioCard
            title="Liquidity Ratio"
            value={`${ratios.liquidityRatio}x`}
            description="Months of expenses covered"
            status={getLiquidityStatus(ratios.liquidityRatio)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <RatioCard
            title="Savings Rate"
            value={`${ratios.savingsRate}%`}
            description="Income saved per month"
            status={getSavingsRateStatus(ratios.savingsRate)}
            icon={<PiggyBank className="h-4 w-4" />}
          />
          <RatioCard
            title="Debt-to-Income"
            value={`${ratios.debtToIncome}%`}
            description="Income spent on debt"
            status={getDebtToIncomeStatus(ratios.debtToIncome)}
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Speedometer */}
      <div className="glass flex flex-col items-center rounded-2xl p-6">
        <h2 className="mb-2 font-mono text-lg font-semibold text-text-primary">
          Overall Health Score
        </h2>
        <Speedometer
          value={healthScore}
          label="Financial Health"
          status={overallStatus}
        />
      </div>

      {/* Assets & Liabilities Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            Assets
          </h3>
          {assets.length === 0 ? (
            <p className="font-mono text-sm italic text-text-secondary/70">
              No assets added yet. Tap &quot;Add Item&quot; to start.
            </p>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => (
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
                      onClick={() => removeAsset(asset.id)}
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

        {/* Liabilities */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            Liabilities
          </h3>
          {liabilities.length === 0 ? (
            <p className="font-mono text-sm italic text-text-secondary/70">
              No liabilities added yet. Tap &quot;Add Item&quot; to start.
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
                      onClick={() => removeLiability(liability.id)}
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

      {/* Add Asset/Liability Modal */}
      <AssetLiabilityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleAddItem}
      />
    </div>
  );
}
