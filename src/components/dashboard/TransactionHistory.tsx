"use client";

import { TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import type { Transaction } from "@/lib/db";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

function relativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}h lalu`;
  if (hours > 0) return `${hours}j lalu`;
  if (minutes > 0) return `${minutes}m lalu`;
  return "Baru saja";
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Receipt className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">
            Transaksi Terbaru
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
            <Receipt className="h-5 w-5 text-text-muted" />
          </div>
          <p className="mt-3 text-sm text-text-muted">
            Belum ada transaksi bulan ini
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Mulai catat pemasukan dan pengeluaranmu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Receipt className="h-4 w-4 text-text-muted" />
        <h2 className="text-sm font-semibold text-text-primary">
          Transaksi Terbaru
        </h2>
        <span className="ml-auto font-mono text-[10px] text-text-muted">
          {transactions.length} transaksi
        </span>
      </div>

      <div className="divide-y divide-border">
        {transactions.slice(0, 8).map((t) => {
          const isIncome = t.type === "income";
          const Icon = isIncome ? TrendingUp : TrendingDown;

          return (
            <div
              key={t.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              {/* Icon */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isIncome ? "bg-success/10" : "bg-danger/10"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isIncome ? "text-success" : "text-danger"
                  }`}
                />
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {t.merchant}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{t.category}</p>
              </div>

              {/* Amount + Time */}
              <div className="shrink-0 text-right">
                <p
                  className={`font-mono text-sm font-semibold ${
                    isIncome ? "text-success" : "text-danger"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  {relativeTime(t.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
