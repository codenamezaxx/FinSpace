"use client";

import { useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { SmartInsights } from "@/components/dashboard/SmartInsights";
import { WealthSpeedometer } from "@/components/dashboard/WealthSpeedometer";
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
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-border" />
        <div className="h-4 w-28 animate-pulse rounded bg-border" />
      </div>
      <div className="mt-4 h-10 w-48 animate-pulse rounded-lg bg-border" />
    </div>
  );
}

function IncomeExpenseSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-border" />
            <div className="h-3 w-16 animate-pulse rounded bg-border" />
          </div>
          <div className="mt-3 h-7 w-32 animate-pulse rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

function SpeedometerSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mx-auto h-[110px] w-[200px] animate-pulse rounded-full bg-border" />
      <div className="mt-3 flex justify-center">
        <div className="h-6 w-16 animate-pulse rounded-full bg-border" />
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

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-52 animate-pulse rounded-lg bg-border" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-border" />
        </div>
        <BalanceSkeleton />
        <IncomeExpenseSkeleton />
        <SpeedometerSkeleton />
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

      {/* ── 1. Total Balance Card ── */}
      <div className="glass relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-[var(--card-hover-shadow)]">
        {/* Decorative gradient blob */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              balance >= 0
                ? "radial-gradient(circle, #22C55E, transparent)"
                : "radial-gradient(circle, #EF4444, transparent)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              balance >= 0 ? "bg-success/15" : "bg-danger/15"
            }`}
          >
            <Wallet
              className={`h-5 w-5 ${
                balance >= 0 ? "text-success" : "text-danger"
              }`}
            />
          </div>
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-text-muted">
            Total Balance
          </span>
        </div>

        <p
          className={`relative mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl ${
            balance >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {formatCurrency(balance)}
        </p>

        {/* Subtle bottom accent line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-full"
          style={{
            background:
              balance >= 0
                ? "linear-gradient(90deg, transparent, #22C55E, transparent)"
                : "linear-gradient(90deg, transparent, #EF4444, transparent)",
            opacity: 0.4,
          }}
        />
      </div>

      {/* ── 2. Income & Expense Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Income */}
        <div className="glass rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--card-hover-shadow)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Income
            </span>
          </div>
          <p className="mt-3 font-mono text-xl font-bold text-success sm:text-2xl">
            {formatCurrency(income)}
          </p>
        </div>

        {/* Expenses */}
        <div className="glass rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--card-hover-shadow)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10">
              <TrendingDown className="h-4 w-4 text-danger" />
            </div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Expenses
            </span>
          </div>
          <p className="mt-3 font-mono text-xl font-bold text-danger sm:text-2xl">
            {formatCurrency(expenses)}
          </p>
        </div>
      </div>

      {/* ── 3. Wealth Speedometer ── */}
      <WealthSpeedometer
        overallStatus={overallStatus}
        liquidityStatus={liquidityStatus}
        savingsStatus={savingsStatus}
        debtStatus={debtStatus}
      />

      {/* ── 4. Smart Insights ── */}
      <SmartInsights
        ratios={ratioData}
        liquidityStatus={liquidityStatus}
        savingsStatus={savingsStatus}
        debtStatus={debtStatus}
        overallStatus={overallStatus}
      />

      {/* ── 5. Transaction History ── */}
      <TransactionHistory transactions={transactions} />
    </div>
  );
}
