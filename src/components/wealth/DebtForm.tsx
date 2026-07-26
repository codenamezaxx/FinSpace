"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { Plus } from "lucide-react";
import type { DebtEntry } from "@/lib/netWorth";
import { formatInputValue, parseInputValue } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

interface DebtFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: DebtEntry) => void;
}

export function DebtForm({ isOpen, onClose, onSave }: DebtFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("wealth.debt_name_required");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = t("wealth.valid_amount");
    if (!dueDate) errs.dueDate = t("wealth.due_date_required");
    else if (new Date(dueDate).getTime() <= Date.now())
      errs.dueDate = t("wealth.due_date_future");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = Date.now();
    onSave({
      id: `dbt${now}_${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      totalAmount: Math.round(Number(amount)),
      dueDate: new Date(dueDate).getTime(),
      paidAmount: 0,
      interestRate: interestRate ? Number(interestRate) : undefined,
      createdAt: now,
    });
    setName("");
    setAmount("");
    setDueDate("");
    setErrors({});
    onClose();
  }

  const inputClasses =
    "w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={t("wealth.add_debt")}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.debt_name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("wealth.debt_name_placeholder")}
            className={inputClasses}
          />
          {errors.name && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.debt_total_label")}
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
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.due_date_label")}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClasses}
          />
          {errors.dueDate && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.dueDate}</p>
          )}
        </div>

        {/* Interest Rate */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.interest_rate_label")}{" "}
            <span className="font-normal lowercase text-text-muted">
              ({t("wealth.optional")})
            </span>
          </label>
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="e.g. 5"
            min="0"
            step="0.1"
            className={inputClasses}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          {t("wealth.add_debt")}
        </button>
      </div>
    </ResponsiveModal>
  );
}
