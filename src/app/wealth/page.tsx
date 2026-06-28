"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { totalMonthlyDebtObligation } from "@/lib/debtUtils";
import {
  Plus,
  Trash2,
  PiggyBank,
  Wallet,
  TrendingDown,
  Gauge,
} from "lucide-react";
import type { AssetEntry, LiabilityEntry, DebtEntry } from "@/lib/netWorth";
import type { HealthStatus } from "@/lib/financialRatios";

const ASSETS_KEY = "finspace_assets";
const LIABILITIES_KEY = "finspace_liabilities";
const DEBTS_KEY = "finspace_debts";

export default function WealthPage() {
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
  const { transactions: allTransactions, addTransaction } = useTransactions();

  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityEntry[]>([]);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtEntry | null>(null);

  const totalBalance = useMemo(() => {
    return allTransactions.reduce(
      (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
      0
    );
  }, [allTransactions]);

  const loadData = useCallback(() => {
    setAssets(loadFromStorage<AssetEntry>(ASSETS_KEY, []));
    setLiabilities(loadFromStorage<LiabilityEntry>(LIABILITIES_KEY, []));
    setDebts(loadFromStorage<DebtEntry>(DEBTS_KEY, []));
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("finspace-assets-updated", loadData);
    window.addEventListener("finspace-debts-updated", loadData);
    return () => {
      window.removeEventListener("finspace-assets-updated", loadData);
      window.removeEventListener("finspace-debts-updated", loadData);
    };
  }, [loadData]);

  const netWorthData = useMemo(
    () => calculateNetWorth(assets, liabilities, totalBalance, debts),
    [assets, liabilities, totalBalance, debts]
  );

  const monthlyData = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Cicilan dihitung dari kewajiban utang, bukan pembayaran aktual (PRD §3 Modul C)
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
    (debt: DebtEntry) => {
      const updated = [...debts, debt];
      setDebts(updated);
      saveToStorage(DEBTS_KEY, updated);
      window.dispatchEvent(new CustomEvent("finspace-debts-updated"));
    },
    [debts]
  );

  const handlePayDebt = useCallback(
    (debtId: string, amount: number, debtName: string) => {
      const updated = debts.map((d) =>
        d.id === debtId
          ? { ...d, paidAmount: (d.paidAmount || 0) + amount }
          : d
      );
      setDebts(updated);
      saveToStorage(DEBTS_KEY, updated);
      window.dispatchEvent(new CustomEvent("finspace-debts-updated"));
      addTransaction({
        amount,
        type: "expense",
        category: "Cicilan",
        merchant: debtName,
        payment_method: "Tunai",
      });
    },
    [debts, addTransaction]
  );

  const handleDeleteDebt = useCallback(
    (debtId: string) => {
      const updated = debts.filter((d) => d.id !== debtId);
      setDebts(updated);
      saveToStorage(DEBTS_KEY, updated);
      window.dispatchEvent(new CustomEvent("finspace-debts-updated"));
    },
    [debts]
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

  function removeAsset(id: string) {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updated));
  }

  function removeLiability(id: string) {
    const updated = liabilities.filter((l) => l.id !== id);
    setLiabilities(updated);
    localStorage.setItem(LIABILITIES_KEY, JSON.stringify(updated));
  }

  return (
    <div className="space-y-6 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kekayaan</h1>
          <p className="mt-1 font-mono text-sm text-text-muted">
            Pantau kekayaan bersih dan kesehatan keuangan
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            openAssetLiabilityModal({
              onPurchase: handlePurchase,
              currentBalance: totalBalance,
            })
          }
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Item
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
          Rasio Kesehatan Keuangan
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RatioCard
            title="Rasio Likuiditas"
            value={`${ratios.liquidityRatio}x`}
            description="Bulan pengeluaran tertutupi"
            status={getLiquidityStatus(ratios.liquidityRatio)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <RatioCard
            title="Rasio Tabungan"
            value={`${ratios.savingsRate}%`}
            description="Pendapatan ditabung per bulan"
            status={getSavingsRateStatus(ratios.savingsRate)}
            icon={<PiggyBank className="h-4 w-4" />}
          />
          <RatioCard
            title="Rasio Utang"
            value={`${ratios.debtToIncome}%`}
            description="Pendapatan untuk utang"
            status={getDebtToIncomeStatus(ratios.debtToIncome)}
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Speedometer */}
      <div className="glass flex flex-col items-center rounded-2xl p-6">
        <h2 className="mb-2 font-mono text-lg font-semibold text-text-primary">
          Skor Kesehatan Keseluruhan
        </h2>
        <Speedometer
          value={healthScore}
          label="Kesehatan Keuangan"
          status={overallStatus}
        />
      </div>

      {/* Assets & Liabilities Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            Aset
          </h3>
          <div className="space-y-2">
            {/* Auto: Saldo Tercatat */}
            <div className="glass flex items-center justify-between rounded-xl border-l-4 border-l-primary p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Saldo Tercatat
                </p>
                <p className="font-mono text-xs text-text-muted">
                  Otomatis dari transaksi
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-success">
                {formatCurrency(totalBalance)}
              </span>
            </div>
            {assets.length === 0 ? (
              <p className="font-mono text-sm italic text-text-secondary/70">
                Belum ada aset. Ketuk &quot;Tambah Item&quot; untuk memulai.
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
                      onClick={() => removeAsset(asset.id)}
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
            Liabilitas
          </h3>
          {liabilities.length === 0 ? (
            <p className="font-mono text-sm italic text-text-secondary/70">
              Belum ada liabilitas. Ketuk &quot;Tambah Item&quot; untuk memulai.
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

      {/* ── Debts ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-text-muted">
            Utang
          </h3>
          <button
            type="button"
            onClick={() => setShowDebtForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-5 py-3 text-sm font-semibold text-primary shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Utang
          </button>
        </div>
        <DebtList
          debts={debts}
          onPay={(debt) => setPayingDebt(debt)}
          onDelete={handleDeleteDebt}
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
    </div>
  );
}
