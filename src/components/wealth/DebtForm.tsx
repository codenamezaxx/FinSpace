"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { Plus } from "lucide-react";
import type { DebtEntry } from "@/lib/netWorth";
import { formatInputValue, parseInputValue } from "@/lib/netWorth";

interface DebtFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: DebtEntry) => void;
}

export function DebtForm({ isOpen, onClose, onSave }: DebtFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama utang harus diisi";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = "Masukkan nominal yang valid";
    if (!dueDate) errs.dueDate = "Pilih tanggal jatuh tempo";
    else if (new Date(dueDate).getTime() <= Date.now())
      errs.dueDate = "Jatuh tempo harus di masa depan";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      totalAmount: Math.round(Number(amount)),
      dueDate: new Date(dueDate).getTime(),
      paidAmount: 0,
      interestRate: interestRate ? Number(interestRate) : undefined,
      createdAt: Date.now(),
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
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Tambah Utang">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Nama Utang / Tujuan
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: KPR Rumah"
            className={inputClasses}
          />
          {errors.name && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total Utang (IDR)
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
            Jatuh Tempo
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

        {/* Suku Bunga (opsional) */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Suku Bunga per Tahun (%){" "}
            <span className="font-normal lowercase text-text-muted">
              (opsional)
            </span>
          </label>
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="cth: 5"
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
          Tambah Utang
        </button>
      </div>
    </ResponsiveModal>
  );
}
