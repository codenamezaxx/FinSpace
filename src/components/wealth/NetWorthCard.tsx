"use client";

import { useState } from "react";
import {
  Banknote,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";

interface NetWorthCardProps {
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  totalDebts: number;
  netWorth: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  collapsible?: boolean;
}

export function NetWorthCard({
  totalBalance,
  totalAssets,
  totalLiabilities,
  totalDebts,
  netWorth,
  title = "Kekayaan Bersih",
  className = "",
  style,
  collapsible = false,
}: NetWorthCardProps) {
  const isPositive = netWorth >= 0;
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className={`rounded-2xl bg-surface/50 p-6 lg:shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 lg:hover:shadow-xl hover:shadow-black/30 ${className}`}
      style={style}
    >
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
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

      {collapsible ? (
        <>
          {/* Toggle detail button */}
          <button
            type="button"
            onClick={() => setShowDetail(!showDetail)}
            className="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-left transition-colors hover:bg-surface"
          >
            <p className="font-mono text-xs font-medium text-text-secondary">
              Detail Kekayaan Bersih
            </p>
            <ChevronDown
              className={`h-4 w-4 text-text-muted transition-transform duration-200 ${
                showDetail ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Animated accordion via grid-template-rows */}
          <div
            className="mt-2 grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: showDetail ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="space-y-2 border-t border-border pt-4">
                <BreakdownRow
                  label="Saldo Tercatat"
                  value={totalBalance}
                  color="text-success"
                >
                  <Banknote className="h-3.5 w-3.5 text-text-muted" />
                </BreakdownRow>
                <BreakdownRow
                  label="Total Aset"
                  value={totalAssets}
                  color="text-success"
                />
                <BreakdownRow
                  label="Total Liabilitas"
                  value={totalLiabilities}
                  color="text-danger"
                  negative
                />
                <BreakdownRow
                  label="Total Utang"
                  value={totalDebts}
                  color="text-danger"
                  negative
                />
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-bold text-text-primary">
                      Kekayaan Bersih
                    </p>
                    <p
                      className={`font-mono text-base font-bold ${
                        isPositive ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatCurrency(Math.abs(netWorth))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Full breakdown (wealth page) */}
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <BreakdownRow
              label="Saldo Tercatat"
              value={totalBalance}
              color="text-success"
            >
              <Banknote className="h-3.5 w-3.5 text-text-muted" />
            </BreakdownRow>
            <BreakdownRow
              label="Total Aset"
              value={totalAssets}
              color="text-success"
            />
            <BreakdownRow
              label="Total Liabilitas"
              value={totalLiabilities}
              color="text-danger"
              negative
            />
            <BreakdownRow
              label="Total Utang"
              value={totalDebts}
              color="text-danger"
              negative
            />
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs font-bold text-text-primary">
                  Kekayaan Bersih
                </p>
                <p
                  className={`font-mono text-base font-bold ${
                    isPositive ? "text-success" : "text-danger"
                  }`}
                >
                  {formatCurrency(Math.abs(netWorth))}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  color,
  negative = false,
  children,
}: {
  label: string;
  value: number;
  color: string;
  negative?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {children}
        <p className="font-mono text-xs text-text-muted">{label}</p>
      </div>
      <p className={`font-mono text-sm font-semibold ${color}`}>
        {negative ? "- " : "+ "}
        {formatCurrency(value)}
      </p>
    </div>
  );
}
