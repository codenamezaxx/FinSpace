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
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import {
  computeCashFlow,
  formatChartYAxis,
  niceCeil,
  type CashFlowRange,
} from "@/lib/monthlyChart";
import type { Transaction } from "@/lib/db";
import { useLanguage } from "@/lib/i18n";

interface MonthlyChartProps {
  transactions: Transaction[];
}

const INCOME_COLOR = "var(--color-success)";
const EXPENSE_COLOR = "var(--color-danger)";

/* ── Custom tooltip (dual-series, cash flow view) ── */
function CashFlowTooltip({
  active,
  payload,
  label,
  incomeLabel,
  expenseLabel,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number | string }>;
  label?: string;
  incomeLabel: string;
  expenseLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const income = payload.find((p) => p.dataKey === "income");
  const expense = payload.find((p) => p.dataKey === "expense");
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-lg shadow-black/30">
      <p className="text-xs text-text-muted">{label}</p>
      {income != null && (
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-sm font-semibold text-text-primary">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: INCOME_COLOR }}
          />
          {incomeLabel}: {formatCurrency(Number(income.value ?? 0))}
        </p>
      )}
      {expense != null && (
        <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-text-primary">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: EXPENSE_COLOR }}
          />
          {expenseLabel}: {formatCurrency(Number(expense.value ?? 0))}
        </p>
      )}
    </div>
  );
}

const RANGES: CashFlowRange[] = ["day", "week", "month", "year"];

export function MonthlyChart({ transactions }: MonthlyChartProps) {
  const { t } = useLanguage();
  const [range, setRange] = useState<CashFlowRange>("day");

  const cashflowData = useMemo(
    () => computeCashFlow(transactions, range),
    [transactions, range]
  );

  /* Explicit numeric domain — never let tick inference drift from data. */
  const domain: [number, number] = useMemo(() => {
    const hi = Math.max(
      0,
      ...cashflowData.map((d) => d.income),
      ...cashflowData.map((d) => d.expense)
    );
    return [0, niceCeil(hi)];
  }, [cashflowData]);

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      {/* ── Header ── */}
      <div className="mb-4 flex items-center gap-2.5">
        <TrendingUp className="h-5 w-5 shrink-0" style={{ color: "var(--color-primary)" }} />
        <h2 className="truncate text-sm font-semibold text-text-primary">
          {t("dashboard.cash_flow")}
        </h2>
      </div>

      {/* ── Range pills ── */}
      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              range === r
                ? "bg-primary/15 text-primary"
                : "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
            }`}
          >
            {t(`dashboard.range_${r}`)}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: INCOME_COLOR }}
          />
          <span className="text-[11px] text-text-muted">{t("dashboard.income")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: EXPENSE_COLOR }}
          />
          <span className="text-[11px] text-text-muted">{t("dashboard.expense")}</span>
        </div>
      </div>

      {/* ── Chart area ── */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={cashflowData}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={INCOME_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={EXPENSE_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.4}
              vertical={false}
            />

            <XAxis
              dataKey="label"
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
              tickFormatter={formatChartYAxis}
              domain={domain}
              tickCount={5}
              allowDecimals={false}
              tick={{
                fontSize: 11,
                fill: "var(--color-text-muted)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
              axisLine={false}
              tickLine={false}
              width={50}
            />

            <Tooltip
              content={
                <CashFlowTooltip
                  incomeLabel={t("dashboard.income")}
                  expenseLabel={t("dashboard.expense")}
                />
              }
            />

            <Area
              type="monotone"
              dataKey="income"
              stroke={INCOME_COLOR}
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke={EXPENSE_COLOR}
              strokeWidth={2.5}
              fill="url(#expenseGrad)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
