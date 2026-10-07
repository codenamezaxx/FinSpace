"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  Minus,
  Plus,
  Banknote,
  Bot,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SmartInsights } from "@/components/dashboard/SmartInsights";
import { MobileCardSwitcher } from "@/components/dashboard/MobileCardSwitcher";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { TopHoldingsCard } from "@/components/dashboard/TopHoldingsCard";
import { DebtSnapshotCard } from "@/components/dashboard/DebtSnapshotCard";
import { NetWorthCard } from "@/components/wealth/NetWorthCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionModal } from "@/lib/transaction-modal-context";
import { useAssetLiabilityModal } from "@/lib/asset-liability-modal-context";
import {
  calculateAllRatios,
  calculateHealthScore,
  calcMoMChange,
  getLiquidityStatus,
  getSavingsRateStatus,
  getDebtToIncomeStatus,
} from "@/lib/financialRatios";
import { formatCurrency, calculateNetWorth } from "@/lib/netWorth";
import { totalMonthlyDebtObligation } from "@/lib/debtUtils";
import type { HealthStatus } from "@/lib/financialRatios";
import type { NetWorthResult } from "@/lib/netWorth";
import { usePockets } from "@/hooks/usePockets";
import { useCloudAuth } from "@/hooks/useCloudAuth";
import { useLanguage } from "@/lib/i18n";

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

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("topbar.greeting_morning");
  if (hour < 15) return t("topbar.greeting_afternoon");
  if (hour < 18) return t("topbar.greeting_evening");
  return t("topbar.greeting_night");
}

function formatPctChange(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

/* ─── MoM badge: +% vs last month. Wraps below nominal when tight. ─── */
function MoMBadge({
  change,
  current,
  newLabel,
  invert = false,
}: {
  change: number | null;
  current: number;
  newLabel: string;
  invert?: boolean;
}) {
  if (change === null || !Number.isFinite(change)) {
    if (current <= 0) return null;
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] font-semibold text-text-muted">
        {newLabel}
      </span>
    );
  }
  const up = change > 0.05;
  const down = change < -0.05;
  const flat = !up && !down;
  const good = invert ? down : up;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
        flat
          ? "bg-surface-alt text-text-muted"
          : good
            ? "bg-success/15 text-success"
            : "bg-danger/15 text-danger"
      }`}
    >
      {up ? (
        <ArrowUpIcon className="h-3 w-3" />
      ) : down ? (
        <ArrowDownIcon className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      {up ? "+" : down ? "−" : ""}
      {formatPctChange(change)}
    </span>
  );
}

/* ─── Skeletons ─── */

function BalanceSkeleton() {
  return (
    <div className="flex flex-row gap-3">
      <div className="glass rounded-2xl p-6 shadow-lg shadow-black/10 w-full">
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
      <div className="hidden lg:block glass rounded-2xl p-6 shadow-lg shadow-black/10 w-full">
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
  const { t, lang } = useLanguage();
  const { user } = useCloudAuth();
  const { openAddTransaction } = useTransactionModal();
  const { openAssetLiabilityModal } = useAssetLiabilityModal();
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();
  // Monthly transactions for income/expense
  const { transactions, loading } = useTransactions({
    startTime: startOfMonth,
  });

  // All transactions for cumulative balance
  const { transactions: allTransactions } = useTransactions();

  /* ── All transactions for 12-month chart ── */
  const twelveMonthsAgo = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime(),
    [now]
  );
  const { transactions: chartTransactions } = useTransactions({
    startTime: twelveMonthsAgo,
  });

  /* ── Share data with Wealth page via localStorage ── */
  const assetsList = useLiveQuery(() => db.assets.toArray(), []) ?? [];
  const liabilitiesList = useLiveQuery(() => db.liabilities.toArray(), []) ?? [];
  const debtsList = useLiveQuery(() => db.debts.toArray(), []) ?? [];
  const {
    pockets,
    balances,
    totalBalance: pocketTotalBalance,
  } = usePockets();

  /* ── Top 3 pockets by balance ── */
  const topPockets = useMemo(() => {
    const list = pockets ?? [];
    return [...list]
      .sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0))
      .slice(0, 3);
  }, [pockets, balances]);

  const netWorthCounts = useMemo(
    () => ({
      assets: assetsList.length,
      liabilities: liabilitiesList.length,
      debts: debtsList.length,
    }),
    [assetsList, liabilitiesList, debtsList]
  );

  /* ── Derived values ── */
  const liquidAssets = useMemo(
    () =>
      assetsList
        .filter((a) => a.type === "liquid")
        .reduce((sum, a) => sum + a.amount, 0),
    [assetsList]
  );

  const netWorthData: NetWorthResult = useMemo(
    () => calculateNetWorth(assetsList, liabilitiesList, pocketTotalBalance, debtsList),
    [assetsList, liabilitiesList, pocketTotalBalance, debtsList]
  );

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
      .filter((t) => t.type === "income" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesTotal = transactions
      .filter((t) => t.type === "expense" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0);

    const allTimeIncome = allTransactions
      .filter((t) => t.type === "income" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0);

    const allTimeExpenses = allTransactions
      .filter((t) => t.type === "expense" && !t.transferId)
      .reduce((sum, t) => sum + t.amount, 0);

    const debtPayments = totalMonthlyDebtObligation(debtsList);

    const ratios = calculateAllRatios(
      liquidAssets,
      expensesTotal,
      incomeTotal,
      debtPayments
    );

    return {
      income: incomeTotal,
      expenses: expensesTotal,
      balance: allTimeIncome - allTimeExpenses,
      ratioData: ratios,
      healthScore: calculateHealthScore(ratios),
      liquidityStatus: getLiquidityStatus(ratios.liquidityRatio),
      savingsStatus: getSavingsRateStatus(ratios.savingsRate),
      debtStatus: getDebtToIncomeStatus(ratios.debtToIncome),
    };
  }, [transactions, allTransactions, liquidAssets, debtsList]);

  /* ── Previous month totals (derived from loaded data, no extra query) ── */
  const prevMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).getTime();
  const prevMonthEnd = startOfMonth - 1;
  const { prevIncome, prevExpenses } = useMemo(() => {
    const inPrev = allTransactions.filter(
      (t) =>
        !t.transferId && t.timestamp >= prevMonthStart && t.timestamp <= prevMonthEnd
    );
    return {
      prevIncome: inPrev
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      prevExpenses: inPrev
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    };
  }, [allTransactions, prevMonthStart, prevMonthEnd]);

  const momIncome = calcMoMChange(income, prevIncome);
  const momExpenses = calcMoMChange(expenses, prevExpenses);

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
        <div className="hidden lg:flex flex-col gap-3">
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
      <div className="hidden lg:flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary lg:text-3xl">
            {getGreeting(t)}, {user?.name ?? t("profile.user")}!
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            {t("dashboard.summary")}
          </p>
        </div>
        <p className="hidden text-right text-sm text-text-muted font-mono lg:block">
          {now.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
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
              className="rounded-2xl border-b-8 border-primary p-6"
              style={{
                background: 'linear-gradient(to bottom left, var(--gradient-card-blue), var(--gradient-card-mid))',
              }}
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("dashboard.total_balance")} &nbsp;-&nbsp;
                {now.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                })}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="min-w-0 wrap-break-word text-2xl font-bold text-text-primary sm:text-3xl">
                  {formatCurrency(Math.abs(balance))}
                </p>
                <div
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
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
                  {isPositive ? t("dashboard.positive") : t("dashboard.negative")}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 [&>div]:min-w-0">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-text-muted">{t("dashboard.income")}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="break-words font-mono text-lg font-semibold text-success">
                      {formatCurrency(income)}
                    </p>
                    <MoMBadge change={momIncome} current={income} newLabel={t("dashboard.mom_new")} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-text-muted">{t("dashboard.expense")}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="break-words font-mono text-lg font-semibold text-danger">
                      {formatCurrency(expenses)}
                    </p>
                    <MoMBadge change={momExpenses} current={expenses} newLabel={t("dashboard.mom_new")} invert />
                  </div>
                </div>
              </div>
            </div>,

            /* Net Worth View */
            <NetWorthCard
              key="networth"
              totalBalance={netWorthData.totalBalance}
              totalAssets={netWorthData.totalAssets}
              totalLiabilities={netWorthData.totalLiabilities}
              totalDebts={netWorthData.totalDebts}
              netWorth={netWorthData.netWorth}
            counts={netWorthCounts}
              collapsible
              className="border-0 border-b-8 border-accent-secondary"
              style={{
                background: 'linear-gradient(to bottom left, var(--gradient-card-purple), var(--gradient-card-mid))',
                height: "100%",
              }}
            />,
          ]}
        />
      </div>

      {/* ── Desktop: 2-column grid — Balance + Net Worth ── */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        {/* Combined Balance + Income/Expense */}
        <div
          className="rounded-2xl border-l-8 border-l-primary p-6 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
          style={{
            background: 'linear-gradient(to bottom left, var(--gradient-card-blue), var(--gradient-card-mid))',
          }}
        >
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("dashboard.total_balance")}
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
               {isPositive ? t("dashboard.positive") : t("dashboard.negative")}
             </div>
           </div>
           <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-text-muted">{t("dashboard.income")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-mono text-lg font-semibold text-success">
                    {formatCurrency(income)}
                  </p>
                  <MoMBadge change={momIncome} current={income} newLabel={t("dashboard.mom_new")} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-text-muted">{t("dashboard.expense")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-mono text-lg font-semibold text-danger">
                    {formatCurrency(expenses)}
                  </p>
                  <MoMBadge change={momExpenses} current={expenses} newLabel={t("dashboard.mom_new")} invert />
                </div>
              </div>
          </div>
        </div>

        {/* Net Worth Card */}
        <NetWorthCard
          totalBalance={netWorthData.totalBalance}
          totalAssets={netWorthData.totalAssets}
          totalLiabilities={netWorthData.totalLiabilities}
          totalDebts={netWorthData.totalDebts}
          netWorth={netWorthData.netWorth}
          counts={netWorthCounts}
          className="border-l-8 border-l-accent-secondary"
          collapsible
          style={{
                background: 'linear-gradient(to bottom left, var(--gradient-card-purple), var(--gradient-card-mid))',
              }}
        />
      </div>

      {/* ── Top Pockets ── */}
      {topPockets.length > 0 && (
        <div className="glass min-w-0 rounded-2xl p-4 lg:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-text-primary">
              <Wallet className="h-5 w-5 shrink-0 text-primary" />
              {t("dashboard.top_pockets")}
            </h2>
            <Link
              href="/budget"
              className="shrink-0 font-mono text-xs font-medium text-primary transition-colors hover:text-text-primary"
            >
              {t("dashboard.see_all")} →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {topPockets.map((p) => (
              <div
                key={p.id}
                className="min-w-0 rounded-xl border border-border/60 bg-surface-alt/40 px-2 py-3 text-center sm:px-3"
              >
                <p className="truncate text-xs font-medium text-text-secondary">
                  {p.name}
                </p>
                <p className="mt-1 truncate font-mono text-xs font-bold text-text-primary sm:text-sm">
                  {formatCurrency(balances[p.id] ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="glass rounded-2xl p-4 lg:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => openAddTransaction()}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-on-primary cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            <Plus className="h-5 w-5" />
            {t("dashboard.new_transaction")}
          </button>
          <button
            type="button"
            onClick={() => openAssetLiabilityModal()}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3.5 text-sm font-semibold text-primary cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-accent-secondary/15"
          >
            <Banknote className="h-5 w-5" />
            {t("dashboard.add_asset_liability")}
          </button>
          <Link
            href="/finny"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-accent-secondary bg-accent-secondary/10 px-6 py-3.5 text-sm font-semibold text-primary cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-secondary hover:shadow-lg hover:shadow-accent-secondary/15"
          >
            <Bot className="h-5 w-5" />
            {t("dashboard.chat_finny")}
          </Link>
        </div>
      </div>

      {/* ── Monthly Chart ── */}
      <MonthlyChart
        transactions={chartTransactions}
        assets={assetsList}
        liabilities={liabilitiesList}
        debts={debtsList}
      />

      {/* ── Row: Transaction History + Top Holdings ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionHistory transactions={transactions} />
        <TopHoldingsCard
          assets={assetsList}
          liabilities={liabilitiesList}
          assetEmptyText={t("dashboard.no_data_yet")}
          liabilityEmptyText={t("dashboard.no_data_yet")}
        />
      </div>

      {/* ── Row: Health Score + Top Debts ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SmartInsights
          ratios={ratioData}
          healthScore={healthScore}
          liquidityStatus={liquidityStatus}
          savingsStatus={savingsStatus}
          debtStatus={debtStatus}
          overallStatus={overallStatus}
        />
        <DebtSnapshotCard debts={debtsList} />
      </div>
    </div>
  );
}
