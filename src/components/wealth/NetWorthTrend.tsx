"use client";

import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { computeMonthlyNetWorth, formatChartYAxis } from "@/lib/monthlyChart";
import {
  formatCurrency,
  type AssetEntry,
  type DebtEntry,
  type LiabilityEntry,
} from "@/lib/netWorth";
import type { Transaction } from "@/lib/db";
import { useLanguage } from "@/lib/i18n";

interface NetWorthTrendProps {
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
  transactions: Transaction[];
  debts: DebtEntry[];
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="font-mono text-[11px] text-text-muted">{label}</p>
      <p className="font-mono text-sm font-bold text-text-primary">
        {formatCurrency(Number(payload[0].value ?? 0))}
      </p>
    </div>
  );
}

export const NetWorthTrend = memo(function NetWorthTrend({
  assets,
  liabilities,
  transactions,
  debts,
}: NetWorthTrendProps) {
  const { t } = useLanguage();

  const data = useMemo(
    () => computeMonthlyNetWorth(assets, liabilities, transactions, debts),
    [assets, liabilities, transactions, debts]
  );

  const nonEmpty = data.some((d) => d.value !== 0);
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const delta = last - first;
  const pct = first !== 0 ? `${delta >= 0 ? "+" : ""}${((delta / Math.abs(first)) * 100).toFixed(1)}%` : null;

  if (!nonEmpty) {
    return (
      <div className="glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <TrendingUp className="h-5 w-5 shrink-0 text-accent-secondary" />
          {t("wealth.trend_title")}
        </h2>
        <p className="mt-3 font-mono text-sm italic text-text-secondary/70">
          {t("wealth.trend_empty")}
        </p>
      </div>
    );
  }

  const up = delta >= 0;

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 truncate text-sm font-semibold text-text-primary">
          <TrendingUp className="h-5 w-5 shrink-0 text-accent-secondary" />
          {t("wealth.trend_title")}
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
            up ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
          }`}
        >
          {up ? "+" : "−"}
          {formatCurrency(Math.abs(delta))}
          {pct ? ` (${pct})` : ""}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="wealthTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent-secondary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-accent-secondary)" stopOpacity={0} />
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
            tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontFamily: "var(--font-jetbrains-mono)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatChartYAxis}
            domain={[0, "dataMax"]}
            tickCount={5}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontFamily: "var(--font-jetbrains-mono)" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<TrendTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-accent-secondary)"
            strokeWidth={2.5}
            fill="url(#wealthTrendGrad)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
