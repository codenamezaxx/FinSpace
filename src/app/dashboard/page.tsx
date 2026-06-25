"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpIcon,
  ArrowDownIcon,
  Plus,
  Wallet,
  Gauge,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { SmartInsights } from "@/components/dashboard/SmartInsights";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { useTransactions } from "@/hooks/useTransactions";
import {
  calculateAllRatios,
  getLiquidityStatus,
  getSavingsRateStatus,
  getDebtToIncomeStatus,
} from "@/lib/financialRatios";
import { formatCurrency } from "@/lib/netWorth";
import type { HealthStatus } from "@/lib/financialRatios";

/* ─── Helpers ─── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
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
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();
  const { transactions, loading } = useTransactions({
    startTime: startOfMonth,
  });

  const {
    income,
    expenses,
    balance,
    ratioData,
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
      0,
      expensesTotal,
      incomeTotal,
      debtPayments
    );

    return {
      income: incomeTotal,
      expenses: expensesTotal,
      balance: incomeTotal - expensesTotal,
      ratioData: ratios,
      liquidityStatus: getLiquidityStatus(ratios.liquidityRatio),
      savingsStatus: getSavingsRateStatus(ratios.savingsRate),
      debtStatus: getDebtToIncomeStatus(ratios.debtToIncome),
    };
  }, [transactions]);

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
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {getGreeting()} 👋
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Ringkasan keuangan bulan{" "}
          {now.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── 1. Total Balance + Income/Expense (NetWorthCard style) ── */}
      <div className="glass rounded-2xl p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
          Total Balance
        </p>

        <div className="mt-3 flex items-baseline gap-3">
          <p className="font-mono text-3xl font-bold text-text-primary">
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
            <p className="font-mono text-xs text-text-muted">Income</p>
            <p className="mt-1 font-mono text-lg font-semibold text-success">
              {formatCurrency(income)}
            </p>
          </div>
          <div>
            <p className="font-mono text-xs text-text-muted">Expenses</p>
            <p className="mt-1 font-mono text-lg font-semibold text-danger">
              {formatCurrency(expenses)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Actions ── */}
      <div className="glass rounded-2xl p-5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 font-mono text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
        >
          <Plus className="h-5 w-5" />
          Tambah Transaksi Baru
        </button>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Link
            href="/budget"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20"
          >
            <Wallet className="h-5 w-5 text-accent" />
            <span className="font-mono text-[11px] font-semibold text-text-secondary">
              Budget
            </span>
          </Link>
          <Link
            href="/wealth"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20"
          >
            <Gauge className="h-5 w-5 text-accent-secondary" />
            <span className="font-mono text-[11px] font-semibold text-text-secondary">
              Wealth
            </span>
          </Link>
          <Link
            href="/tools"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20"
          >
            <Wrench className="h-5 w-5 text-text-muted" />
            <span className="font-mono text-[11px] font-semibold text-text-secondary">
              Tools
            </span>
          </Link>
        </div>
      </div>

      {/* ── 3. Smart Insights ── */}
      <SmartInsights
        ratios={ratioData}
        liquidityStatus={liquidityStatus}
        savingsStatus={savingsStatus}
        debtStatus={debtStatus}
        overallStatus={overallStatus}
      />

      {/* ── 4. Transaction History ── */}
      <TransactionHistory transactions={transactions} />
    </div>
  );
}
