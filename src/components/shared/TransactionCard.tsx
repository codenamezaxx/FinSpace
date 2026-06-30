"use client";

import { memo } from "react";
import { ArrowDownRight, ArrowUpRight, ShoppingBag, type LucideIcon } from "lucide-react";
import { usePockets } from "@/hooks/usePockets";
import type { Transaction } from "@/lib/db";

const categoryIcons: Record<string, LucideIcon> = {
  "Makanan & Minuman": ShoppingBag,
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface TransactionCardProps {
  transaction: Transaction;
}

export const TransactionCard = memo(function TransactionCard({ transaction }: TransactionCardProps) {
  const isExpense = transaction.type === "expense";
  const { pockets } = usePockets();
  const pocket = pockets.find((p) => p.id === transaction.pocketId);
  const Icon = categoryIcons[transaction.category] || ShoppingBag;

  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Direction indicator */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isExpense
            ? "bg-danger/10 text-danger"
            : "bg-success/10 text-success"
        }`}
      >
        {isExpense ? (
          <ArrowDownRight className="h-5 w-5" />
        ) : (
          <ArrowUpRight className="h-5 w-5" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-text-primary">
          {transaction.merchant}
        </p>
        <p className="text-xs text-text-muted">
          {transaction.category} &middot; {formatDate(transaction.timestamp)}
        </p>
      </div>

      {/* Amount + payment */}
      <div className="text-right shrink-0">
        <p
          className={`font-mono font-semibold ${
            isExpense ? "text-danger" : "text-success"
          }`}
        >
          {isExpense ? "-" : "+"}
          {formatAmount(transaction.amount)}
        </p>
        <p className="text-xs text-text-muted">
          {pocket?.name ?? transaction.payment_method}
        </p>
      </div>
    </div>
  );
});
