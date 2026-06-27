"use client";

import { memo } from "react";
import type { CSSProperties } from "react";
import { NetWorthResult, formatCurrency } from "@/lib/netWorth";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface NetWorthCardProps {
  data: NetWorthResult;
  className?: string;
  style?: CSSProperties;
}

export const NetWorthCard = memo(function NetWorthCard({
  data,
  className = "",
  style,
}: NetWorthCardProps) {
  const { totalAssets, totalLiabilities, netWorth } = data;
  const isPositive = netWorth >= 0;

  return (
    <div className={`rounded-2xl border border-border p-6 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${!style ? "bg-surface/50" : ""} ${className}`} style={style}>
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
        Kekayaan Bersih
      </p>

      <div className="mt-3 flex items-baseline gap-3">
        <p className="text-3xl font-bold text-text-primary">
          {formatCurrency(Math.abs(netWorth))}
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
          <p className="font-mono text-xs text-text-muted">Total Aset</p>
          <p className="mt-1 font-mono text-lg font-semibold text-success">
            {formatCurrency(totalAssets)}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs text-text-muted">Total Liabilitas</p>
          <p className="mt-1 font-mono text-lg font-semibold text-danger">
            {formatCurrency(totalLiabilities)}
          </p>
        </div>
      </div>
    </div>
  );
});
