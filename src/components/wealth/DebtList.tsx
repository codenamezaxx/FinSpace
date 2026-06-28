"use client";

import { Trash2, HandCoins, AlertTriangle } from "lucide-react";
import type { DebtEntry } from "@/lib/netWorth";
import { formatCurrency } from "@/lib/netWorth";
import { calcInstallment, remainingAmount } from "@/lib/debtUtils";
import type { InstallmentResult } from "@/lib/debtUtils";

interface DebtListProps {
  debts: DebtEntry[];
  onPay: (debt: DebtEntry) => void;
  onDelete: (id: string) => void;
}

export function DebtList({ debts, onPay, onDelete }: DebtListProps) {
  if (debts.length === 0) {
    return (
      <p className="font-mono text-sm italic text-text-secondary/70">
        Belum ada utang. Ketuk &quot;Tambah Utang&quot; untuk memulai.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {debts.map((debt) => {
        const remaining = remainingAmount(debt);
        const progress = debt.totalAmount > 0
          ? Math.round((debt.paidAmount / debt.totalAmount) * 100)
          : 0;
        const installment = calcInstallment(remaining, debt.dueDate, debt.interestRate);

        return (
          <DebtItem
            key={debt.id}
            debt={debt}
            remaining={remaining}
            progress={progress}
            installment={installment}
            onPay={() => onPay(debt)}
            onDelete={() => onDelete(debt.id)}
          />
        );
      })}
    </div>
  );
}

function DebtItem({
  debt,
  remaining,
  progress,
  installment,
  onPay,
  onDelete,
}: {
  debt: DebtEntry;
  remaining: number;
  progress: number;
  installment: InstallmentResult;
  onPay: () => void;
  onDelete: () => void;
}) {
  let infoText = "";
  if (installment.overdue) {
    infoText = "Terlambat";
  } else if (installment.period === "bulan") {
    infoText = `Cicil ${formatCurrency(installment.amount)}/bln (${installment.count} bulan lagi)`;
  } else {
    infoText = `Cicil ${formatCurrency(installment.amount)}/minggu (${installment.count} minggu lagi)`;
  }

  const interestInfo =
    installment.interestTotal != null && installment.interestTotal > 0
      ? `Bunga ${formatCurrency(installment.interestTotal)}`
      : null;

  return (
    <div className="glass rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">{debt.name}</p>
          <p className={`mt-0.5 font-mono text-xs ${installment.overdue ? "text-danger" : "text-text-muted"}`}>
            {installment.overdue && <AlertTriangle className="mr-1 inline h-3 w-3" />}
            {infoText}
          </p>
          {interestInfo && (
            <p className="mt-0.5 font-mono text-[11px] text-accent">
              {interestInfo}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text-primary">
            {formatCurrency(remaining)}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="text-text-muted transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-text-muted">{progress}%</span>
      </div>

      {/* Due date + pay button */}
      <div className="mt-2 flex items-center justify-between">
        <p className="font-mono text-[11px] text-text-muted">
          Jatuh tempo: {new Date(debt.dueDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <button
          type="button"
          onClick={onPay}
          disabled={remaining <= 0}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <HandCoins className="h-3.5 w-3.5" />
          Bayar
        </button>
      </div>
    </div>
  );
}
