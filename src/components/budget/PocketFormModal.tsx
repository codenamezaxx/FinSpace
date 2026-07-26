"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { useLanguage } from "@/lib/i18n";
import { formatInputValue, parseInputValue } from "@/lib/netWorth";
import type { Pocket } from "@/lib/pocket";

interface PocketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, category: Pocket["category"], initialBalance?: number) => void;
  initialName?: string;
  title: string;
}

const CATEGORIES: Array<{ value: Pocket["category"]; labelKey: string }> = [
  { value: "tunai", labelKey: "transaction.cash" },
  { value: "ewallet", labelKey: "transaction.ewallet" },
  { value: "rekening", labelKey: "transaction.bank_account" },
];

export function PocketFormModal({ isOpen, onClose, onSave, initialName, title }: PocketFormModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Pocket["category"]>("ewallet");
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialName ?? "");
      setCategory("ewallet");
      setInitialBalance("");
      setError("");
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("budget.pocket_name_required"));
      return;
    }
    const balance = Number(initialBalance);
    if (initialBalance && (isNaN(balance) || balance < 0)) {
      setError(t("budget.initial_balance_invalid"));
      return;
    }
    onSave(trimmed, category, balance > 0 ? balance : undefined);
    onClose();
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t("budget.pocket_name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("budget.pocket_name_placeholder")}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>
        {!initialName && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">{t("transaction.category")}</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      category === c.value
                        ? "bg-primary text-white"
                        : "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
                    }`}
                  >
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                {t("budget.initial_balance_optional")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatInputValue(initialBalance)}
                onChange={(e) => setInitialBalance(parseInputValue(e.target.value))}
                className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 font-mono text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>
          </>
        )}
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
        >
          {initialName ? t("common.save") : t("budget.add_pocket")}
        </button>
      </form>
    </ResponsiveModal>
  );
}
