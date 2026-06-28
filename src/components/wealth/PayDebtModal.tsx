"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { SendHorizonal } from "lucide-react";
import type { DebtEntry } from "@/lib/netWorth";
import { formatCurrency } from "@/lib/netWorth";
import { remainingAmount } from "@/lib/debtUtils";

interface PayDebtModalProps {
  isOpen: boolean;
  debt: DebtEntry | null;
  onClose: () => void;
  onPay: (debtId: string, amount: number, debtName: string) => void;
}

export function PayDebtModal({
  isOpen,
  debt,
  onClose,
  onPay,
}: PayDebtModalProps) {
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!debt) return null;
  const currentDebt = debt;

  const remaining = remainingAmount(currentDebt);

  function validate() {
    const errs: Record<string, string> = {};
    const val = Number(amount);
    if (!amount || isNaN(val) || val <= 0)
      errs.amount = "Masukkan nominal yang valid";
    else if (val > remaining)
      errs.amount = `Maksimal ${formatCurrency(remaining)}`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handlePay() {
    if (!validate()) return;
    onPay(currentDebt.id, Math.round(Number(amount)), currentDebt.name);
    setAmount("");
    setErrors({});
    onClose();
  }

  // Debt summary content
  const debtContent = (
    <div className="rounded-xl border border-border bg-surface-alt p-3">
      <p className="text-sm text-text-primary">{currentDebt.name}</p>
      <p className="mt-1 font-mono text-sm text-text-muted">
        Sisa: {formatCurrency(remaining)}
      </p>
    </div>
  );

  const inputClasses =
    "w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Bayar Cicilan">
      <div className="space-y-4">
        {debtContent}

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Nominal Pembayaran (IDR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={inputClasses}
          />
          {errors.amount && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.amount}</p>
          )}
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            Maks: {formatCurrency(remaining)}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
        >
          <SendHorizonal className="h-4 w-4" />
          Bayar Cicilan
        </button>
      </div>
    </ResponsiveModal>
  );
}
