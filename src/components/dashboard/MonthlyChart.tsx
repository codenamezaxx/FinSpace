"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Gauge } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import {
  computeMonthlyIncome,
  computeMonthlyNetWorth,
  type MonthlyDataPoint,
} from "@/lib/monthlyChart";
import type { Transaction } from "@/lib/db";
import type { AssetEntry, LiabilityEntry, DebtEntry } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

interface MonthlyChartProps {
  transactions: Transaction[];
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
  debts?: DebtEntry[];
}

/* ── Y-axis formatter: 1.5jt / 750rb / 500 ── */
function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value.toString();
}

/* ── Custom tooltip ── */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length > 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-lg shadow-black/30">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="mt-1 font-mono text-sm font-semibold text-text-primary">
          {formatCurrency(payload[0].value ?? 0)}
        </p>
      </div>
    );
  }
  return null;
}

type ChartView = "income" | "netWorth";

export function MonthlyChart({
  transactions,
  assets,
  liabilities,
  debts = [],
}: MonthlyChartProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<ChartView>("income");

  const incomeData = useMemo(
    () => computeMonthlyIncome(transactions),
    [transactions]
  );
  const netWorthData = useMemo(
    () => computeMonthlyNetWorth(assets, liabilities, transactions, debts),
    [assets, liabilities, transactions, debts]
  );

  const chartData: MonthlyDataPoint[] =
    view === "income" ? incomeData : netWorthData;

  return (
    <div className="glass rounded-2xl p-5">
      {/* ── Header ── */}
      <div className="mb-4 flex items-center gap-2.5">
        {view === "income" ? (
          <TrendingUp className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        ) : (
          <Gauge className="h-5 w-5" style={{ color: "var(--color-accent-secondary)" }} />
        )}
        <h2 className="text-sm font-semibold text-text-primary">
          {t("dashboard.cash_flow")}
        </h2>
      </div>

      {/* ── Toggle tabs ── */}
      <div className="mb-5 flex rounded-xl border border-border bg-surface-alt p-1">
        {(["income", "netWorth"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-3 text-xs font-medium transition-all duration-200 ${
              view === v
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {v === "income" ? t("dashboard.income") : t("dashboard.balance")}
          </button>
        ))}
      </div>

      {/* ── Chart area ── */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={view === "income" ? "incomeGrad" : "netWorthGrad"}
                x1="0" y1="0" x2="0" y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={view === "income" ? "var(--color-primary)" : "var(--color-accent-secondary)"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={view === "income" ? "var(--color-primary)" : "var(--color-accent-secondary)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.4}
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{
                fontSize: 11,
                fill: "var(--color-text-muted)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tickFormatter={formatYAxis}
              tick={{
                fontSize: 11,
                fill: "var(--color-text-muted)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
              axisLine={false}
              tickLine={false}
              width={50}
            />

            <Tooltip content={<ChartTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke={view === "income" ? "var(--color-primary)" : "var(--color-accent-secondary)"}
              strokeWidth={2.5}
              fill={`url(#${view === "income" ? "incomeGrad" : "netWorthGrad"})`}
              dot={{
                fill: view === "income" ? "var(--color-primary)" : "var(--color-accent-secondary)",
                stroke: view === "income" ? "var(--color-primary)" : "var(--color-accent-secondary)",
                strokeWidth: 2,
                r: 3,
              }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
