"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { SendHorizonal } from "lucide-react";
import type { DebtEntry } from "@/lib/netWorth";
import { formatCurrency, formatInputValue, parseInputValue } from "@/lib/netWorth";
import { remainingAmount } from "@/lib/debtUtils";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!debt) return null;
  const currentDebt = debt;

  const remaining = remainingAmount(currentDebt);

  function validate() {
    const errs: Record<string, string> = {};
    const val = Number(amount);
    if (!amount || isNaN(val) || val <= 0)
      errs.amount = t("wealth.valid_amount");
    else if (val > remaining)
      errs.amount = `${t("wealth.max_label")} ${formatCurrency(remaining)}`;
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
        {t("wealth.remaining_label")}: {formatCurrency(remaining)}
      </p>
    </div>
  );

  const inputClasses =
    "w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={t("wealth.pay_debt_confirm")}>
      <div className="space-y-4">
        {debtContent}

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.pay_amount_label")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatInputValue(amount)}
            onChange={(e) => setAmount(parseInputValue(e.target.value))}
            placeholder="0"
            className={inputClasses}
          />
          {errors.amount && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.amount}</p>
          )}
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {t("wealth.max_label")}: {formatCurrency(remaining)}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-mono text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
        >
          <SendHorizonal className="h-4 w-4" />
          {t("wealth.pay_debt_confirm")}
        </button>
      </div>
    </ResponsiveModal>
  );
}
