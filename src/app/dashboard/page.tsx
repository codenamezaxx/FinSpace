"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  Plus,
  Wallet,
  Gauge,
  Wrench,
  Banknote,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SmartInsights } from "@/components/dashboard/SmartInsights";
import { MobileCardSwitcher } from "@/components/dashboard/MobileCardSwitcher";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { NetWorthCard } from "@/components/wealth/NetWorthCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionModal } from "@/lib/transaction-modal-context";
import { useAssetLiabilityModal } from "@/lib/asset-liability-modal-context";
import {
  calculateAllRatios,
  calculateHealthScore,
  getLiquidityStatus,
  getSavingsRateStatus,
  getDebtToIncomeStatus,
} from "@/lib/financialRatios";
import { formatCurrency, calculateNetWorth } from "@/lib/netWorth";
import type { HealthStatus } from "@/lib/financialRatios";
import type { NetWorthResult, AssetEntry, LiabilityEntry } from "@/lib/netWorth";

/* ─── Dynamic import — Recharts is heavy, only load when needed ─── */
const MonthlyChart = dynamic(
  () =>
    import("@/components/dashboard/MonthlyChart").then(
      (mod) => mod.MonthlyChart
    ),
  {
    loading: () => (
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-border" />
        <div className="mb-5 h-8 animate-pulse rounded-xl bg-border" />
        <div className="h-56 animate-pulse rounded-xl bg-border" />
      </div>
    ),
    ssr: false,
  }
);

/* ─── Helpers ─── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi!";
  if (hour < 15) return "Selamat Siang!";
  if (hour < 18) return "Selamat Sore!";
  return "Selamat Malam!";
}

/* ─── Skeletons ─── */

function BalanceSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 shadow-lg shadow-black/10">
      <div className="h-3 w-24 animate-pulse rounded bg-border" />
      <div className="mt-4 flex items-baseline gap-3">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-border" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-border" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div className="space-y-2">
          <div className="h-3 w-14 animate-pulse rounded bg-border" />
          <div className="h-6 w-28 animate-pulse rounded bg-border" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-14 animate-pulse rounded bg-border" />
          <div className="h-6 w-28 animate-pulse rounded bg-border" />
        </div>
      </div>
    </div>
  );
}

function CTASkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="h-[52px] w-full animate-pulse rounded-xl bg-border" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-xl bg-border" />
        ))}
      </div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 h-4 w-36 animate-pulse rounded bg-border" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-border" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 animate-pulse rounded bg-border" />
              <div className="h-2.5 w-16 animate-pulse rounded bg-border" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function DashboardPage() {
  const { openAddTransaction } = useTransactionModal();
  const { openAssetLiabilityModal } = useAssetLiabilityModal();
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();
  const { transactions, loading } = useTransactions({
    startTime: startOfMonth,
  });

  /* ── All transactions for 12-month chart ── */
  const twelveMonthsAgo = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime(),
    [now]
  );
  const { transactions: chartTransactions } = useTransactions({
    startTime: twelveMonthsAgo,
  });

  /* ── Share data with Wealth page via localStorage ── */
  const [liquidAssets, setLiquidAssets] = useState(0);
  const [netWorthData, setNetWorthData] = useState<NetWorthResult>({
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    liquidAssets: 0,
  });
  const [assetsList, setAssetsList] = useState<AssetEntry[]>([]);
  const [liabilitiesList, setLiabilitiesList] = useState<LiabilityEntry[]>([]);

  const loadAssets = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const rawAssets = localStorage.getItem("finspace_assets");
        const rawLiabilities = localStorage.getItem("finspace_liabilities");

        const assets: AssetEntry[] = rawAssets ? JSON.parse(rawAssets) : [];
        const liabilities: LiabilityEntry[] = rawLiabilities
          ? JSON.parse(rawLiabilities)
          : [];

        setAssetsList(assets);
        setLiabilitiesList(liabilities);

        const cash = assets
          .filter((a) => a.type === "liquid")
          .reduce((sum, a) => sum + a.amount, 0);
        setLiquidAssets(cash);

        setNetWorthData(calculateNetWorth(assets, liabilities));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    loadAssets();
    window.addEventListener("finspace-assets-updated", loadAssets);
    return () =>
      window.removeEventListener("finspace-assets-updated", loadAssets);
  }, [loadAssets]);

  const {
    income,
    expenses,
    balance,
    ratioData,
    healthScore,
    liquidityStatus,
    savingsStatus,
    debtStatus,
  } = useMemo(() => {
    const incomeTotal = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesTotal = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const debtPayments = transactions
      .filter(
        (t) =>
          t.type === "expense" && ["Cicilan", "Utang"].includes(t.category)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const ratios = calculateAllRatios(
      liquidAssets,
      expensesTotal,
      incomeTotal,
      debtPayments
    );

    return {
      income: incomeTotal,
      expenses: expensesTotal,
      balance: incomeTotal - expensesTotal,
      ratioData: ratios,
      healthScore: calculateHealthScore(ratios),
      liquidityStatus: getLiquidityStatus(ratios.liquidityRatio),
      savingsStatus: getSavingsRateStatus(ratios.savingsRate),
      debtStatus: getDebtToIncomeStatus(ratios.debtToIncome),
    };
  }, [transactions, liquidAssets]);

  const overallStatus: HealthStatus = useMemo(() => {
    const statuses = [liquidityStatus, savingsStatus, debtStatus];
    if (statuses.some((s) => s === "danger")) return "danger";
    if (statuses.some((s) => s === "warning")) return "warning";
    return "safe";
  }, [liquidityStatus, savingsStatus, debtStatus]);

  const isPositive = balance >= 0;

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-52 animate-pulse rounded-lg bg-border" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-border" />
        </div>
        <BalanceSkeleton />
        <CTASkeleton />
        <div className="glass rounded-2xl p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-border" />
            ))}
          </div>
        </div>
        <TransactionSkeleton />
      </div>
    );
  }

  /* ─── Render ─── */
  return (
    <div className="space-y-6 pb-8 lg:px-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary lg:text-3xl">
            {getGreeting()} 👋
          </h1>
          <p className="font-mono mt-1 text-sm text-text-muted">
            Berikut adalah ringkasan keuangan Anda
          </p>
        </div>
        <p className="hidden text-right text-sm text-text-muted font-mono lg:block">
          {now.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Mobile: Switchable Balance / Net Worth card ── */}
      <div className="lg:hidden">
        <MobileCardSwitcher
          views={[
            /* Balance View */
            <div
              key="balance"
              className="rounded-2xl border border-border p-6 shadow-lg shadow-black/20 backdrop-blur-xl"
              style={{
                background: 'linear-gradient(to bottom left, var(--gradient-card-blue), var(--gradient-card-mid))',
              }}
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Total Saldo
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-3xl font-bold text-text-primary">
                  {formatCurrency(Math.abs(balance))}
                </p>
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isPositive
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  )}
                  {isPositive ? "Positif" : "Negatif"}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-xs text-text-muted">Pemasukan</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-success">
                    {formatCurrency(income)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-text-muted">Pengeluaran</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-danger">
                    {formatCurrency(expenses)}
                  </p>
                </div>
              </div>
            </div>,

            /* Net Worth View */
            <div
              key="networth"
              className="rounded-2xl border border-border p-6 shadow-lg shadow-black/20 backdrop-blur-xl"
              style={{
                background: 'linear-gradient(to bottom left, var(--gradient-card-purple), var(--gradient-card-mid))',
              }}
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Kekayaan Bersih
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-3xl font-bold text-text-primary">
                  {formatCurrency(Math.abs(netWorthData.netWorth))}
                </p>
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    netWorthData.netWorth >= 0
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {netWorthData.netWorth >= 0 ? (
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  )}
                  {netWorthData.netWorth >= 0 ? "Positif" : "Negatif"}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-xs text-text-muted">Total Aset</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-success">
                    {formatCurrency(netWorthData.totalAssets)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs text-text-muted">Total Liabilitas</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-danger">
                    {formatCurrency(netWorthData.totalLiabilities)}
                  </p>
                </div>
              </div>
            </div>,
          ]}
        />
      </div>

      {/* ── Desktop: 2-column grid — Balance + Net Worth ── */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        {/* Combined Balance + Income/Expense */}
        <div
          className="rounded-2xl border border-border border-l-8 border-l-primary p-6 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
          style={{
            background: 'linear-gradient(to bottom left, var(--gradient-card-blue), var(--gradient-card-mid))',
          }}
        >
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total Saldo
           </p>
           <div className="mt-3 flex items-baseline gap-3">
             <p className="text-3xl font-bold text-text-primary">
               {formatCurrency(Math.abs(balance))}
             </p>
             <div
               className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                 isPositive
                   ? "bg-success/15 text-success"
                   : "bg-danger/15 text-danger"
               }`}
             >
               {isPositive ? (
                 <ArrowUpIcon className="h-3.5 w-3.5" />
               ) : (
                 <ArrowDownIcon className="h-3.5 w-3.5" />
               )}
               {isPositive ? "Positif" : "Negatif"}
             </div>
           </div>
           <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
             <div>
               <p className="font-mono text-xs text-text-muted">Pemasukan</p>
               <p className="mt-1 font-mono text-lg font-semibold text-success">
                 {formatCurrency(income)}
               </p>
             </div>
             <div>
               <p className="font-mono text-xs text-text-muted">Pengeluaran</p>
              <p className="mt-1 font-mono text-lg font-semibold text-danger">
                {formatCurrency(expenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Worth Card */}
        <NetWorthCard
          data={netWorthData}
          className="border-l-8 border-l-accent-secondary"
          style={{
            background: 'linear-gradient(to bottom left, var(--gradient-card-purple), var(--gradient-card-mid))',
          }}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="glass rounded-2xl p-4 lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col lg:flex-row gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => openAddTransaction()}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
            >
              <Plus className="h-5 w-5" />
              Transaksi Baru
            </button>
            <button
              type="button"
              onClick={() => openAssetLiabilityModal()}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-accent-secondary/40 bg-accent-secondary/10 px-6 py-3 text-sm font-semibold text-accent-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-secondary hover:shadow-lg hover:shadow-accent-secondary/15"
            >
              <Banknote className="h-5 w-5" />
              Tambah Aset / Liabilitas
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 lg:gap-4">
            <Link
              href="/budget"
              className="flex flex-col items-center gap-1 rounded-xl border border-border w-full bg-surface-alt px-4 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 lg:flex-row lg:gap-2 lg:px-5 lg:py-2.5 lg:h-full"
            >
              <Wallet className="h-5 w-5 text-accent" />
              <span className="text-[11px] font-semibold text-text-secondary">
                Anggaran
              </span>
            </Link>
            <Link
              href="/wealth"
              className="flex flex-col items-center gap-1 rounded-xl border border-border w-full bg-surface-alt px-4 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 lg:flex-row lg:gap-2 lg:px-5 lg:py-2.5 lg:h-full"
            >
              <Gauge className="h-5 w-5 text-accent-secondary" />
              <span className="text-[11px] font-semibold text-text-secondary">
                Kekayaan
              </span>
            </Link>
            <Link
              href="/tools"
              className="flex flex-col items-center gap-1 rounded-xl border border-border w-full bg-surface-alt px-4 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 lg:flex-row lg:gap-2 lg:px-5 lg:py-2.5 lg:h-full"
            >
              <Wrench className="h-5 w-5 text-text-muted" />
              <span className="text-[11px] font-semibold text-text-secondary">
                Alat
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Monthly Chart ── */}
      <MonthlyChart
        transactions={chartTransactions}
        assets={assetsList}
        liabilities={liabilitiesList}
      />

      {/* ── Bottom: Smart Insights + Transaction History ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SmartInsights
          ratios={ratioData}
          healthScore={healthScore}
          liquidityStatus={liquidityStatus}
          savingsStatus={savingsStatus}
          debtStatus={debtStatus}
          overallStatus={overallStatus}
        />
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}
