"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Receipt, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import type { Transaction } from "@/lib/db";
import { useLanguage } from "@/lib/i18n";

interface TransactionHistoryProps {
  transactions: Transaction[];
  viewAllHref?: string;
}

function relativeTime(timestamp: number, t: (key: string, params?: Record<string, string>) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return t("common.days_ago", { count: String(days) });
  if (hours > 0) return t("common.hours_ago", { count: String(hours) });
  if (minutes > 0) return t("common.minutes_ago", { count: String(minutes) });
  return t("common.just_now");
}

export function TransactionHistory({ transactions, viewAllHref }: TransactionHistoryProps) {
  const { t } = useLanguage();

  if (transactions.length === 0) {
    return (
      <div className="glass min-w-0 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Receipt className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-semibold text-text-primary">
            {t("dashboard.recent")}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
            <Receipt className="h-5 w-5 text-text-muted" />
          </div>
          <p className="mt-3 text-sm text-text-muted">
            {t("common.no_transactions")}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t("common.no_transactions_hint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Receipt className="h-4 w-4 shrink-0 text-text-muted" />
        <h2 className="truncate text-sm font-semibold text-text-primary">
          {t("dashboard.recent")}
        </h2>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-text-muted">
          {t("common.transaction_count", { count: String(transactions.length) })}
        </span>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {t("wealth.view_all")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="divide-y divide-border">
        {transactions.slice(0, 8).map((tx) => {
          const isIncome = tx.type === "income";
          const Icon = isIncome ? TrendingUp : TrendingDown;

          return (
            <div
              key={tx.id}
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
                  {tx.merchant}
                </p>
                <p className="mt-0.5 break-words text-xs text-text-muted">{tx.category}</p>
              </div>

              {/* Amount + Time */}
              <div className="shrink-0 text-right">
                <p
                  className={`font-mono text-sm font-semibold ${
                    isIncome ? "text-success" : "text-danger"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  {relativeTime(tx.timestamp, t)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
