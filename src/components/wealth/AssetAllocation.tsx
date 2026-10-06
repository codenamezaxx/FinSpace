"use client";

import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PiggyBank } from "lucide-react";
import { formatCurrency, type AssetEntry } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

const SLICES = [
  { type: "liquid", color: "var(--color-primary)" },
  { type: "investment", color: "var(--color-accent-secondary)" },
  { type: "property", color: "var(--color-success)" },
  { type: "other", color: "var(--color-warning)" },
] as const;

export const AssetAllocation = memo(function AssetAllocation({
  assets,
}: {
  assets: AssetEntry[];
}) {
  const { t } = useLanguage();

  const { total, rows } = useMemo(() => {
    const total = assets.reduce((sum, a) => sum + a.amount, 0);
    const rows = SLICES.map((s) => {
      const value = assets
        .filter((a) => a.type === s.type)
        .reduce((sum, a) => sum + a.amount, 0);
      return {
        ...s,
        label: t(`wealth.${s.type}`),
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
      };
    }).filter((r) => r.value > 0);
    return { total, rows };
  }, [assets, t]);

  if (total <= 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <PiggyBank className="h-5 w-5 shrink-0 text-accent-secondary" />
          {t("wealth.allocation_title")}
        </h2>
        <p className="mt-3 font-mono text-sm italic text-text-secondary/70">
          {t("wealth.allocation_empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <PiggyBank className="h-5 w-5 shrink-0 text-accent-secondary" />
        {t("wealth.allocation_title")}
      </h2>
      <div className="relative mx-auto h-52 w-full max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 12,
              }}
            />
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="88%"
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={800}
            >
              {rows.map((r) => (
                <Cell key={r.type} fill={r.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-lg font-bold text-text-primary">
            {formatCurrency(total)}
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            {rows.length} {t("wealth.allocation_types")}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.type} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: r.color }}
            />
            <span className="flex-1 truncate text-text-secondary">{r.label}</span>
            <span className="font-mono text-xs text-text-muted">
              {r.pct.toFixed(1)}%
            </span>
            <span className="w-28 text-right font-mono text-xs font-semibold text-text-primary">
              {formatCurrency(r.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
