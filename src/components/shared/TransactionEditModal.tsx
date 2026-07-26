"use client";

import { useEffect, useState } from "react";
import { ResponsiveModal } from "./ResponsiveModal";
import { usePockets } from "@/hooks/usePockets";
import { useLanguage } from "@/lib/i18n";
import { formatInputValue, parseInputValue } from "@/lib/netWorth";
import type { Transaction } from "@/lib/db";

const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (id: string, data: Partial<Omit<Transaction, "id">>) => void;
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  "Makanan & Minuman": "transaction.food",
  Transportasi: "transaction.transport",
  Belanja: "transaction.shopping",
  Hiburan: "transaction.entertainment",
  Tagihan: "transaction.bills",
  Kesehatan: "transaction.health",
  Pendidikan: "transaction.education",
  Lainnya: "wealth.other",
};

export function TransactionEditModal({
  isOpen,
  onClose,
  transaction,
  onSave,
}: TransactionEditModalProps) {
  const { t } = useLanguage();
  const { pockets } = usePockets();

  const [tab, setTab] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [selectedPocketId, setSelectedPocketId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from transaction when opening
  useEffect(() => {
    if (isOpen && transaction) {
      setTab(transaction.type);
      setAmount(String(transaction.amount));
      setMerchant(transaction.merchant);
      setCategory(
        EXPENSE_CATEGORIES.includes(transaction.category)
          ? transaction.category
          : transaction.type === "income"
            ? "Lainnya"
            : EXPENSE_CATEGORIES[0]
      );
      setSelectedPocketId(transaction.pocketId ?? "");
      setError("");
    }
  }, [isOpen, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setError("");

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError(t("transaction.valid_amount"));
      return;
    }
    if (!merchant.trim()) {
      setError(
        tab === "income"
          ? t("transaction.valid_income_source")
          : t("transaction.valid_merchant")
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSave(transaction.id, {
        amount: numAmount,
        type: tab,
        category: tab === "income" ? "Pemasukkan" : category,
        merchant: merchant.trim(),
        payment_method:
          pockets.find((p) => p.id === selectedPocketId)?.name ?? "Tunai",
        pocketId: selectedPocketId,
      });
      onClose();
    } catch {
      setError(t("transaction.save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={t("transaction.title_edit")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tab Toggle */}
        <div className="flex rounded-xl border border-border bg-surface-alt p-1">
          {(["expense", "income"] as const).map((tabType) => (
            <button
              key={tabType}
              type="button"
              onClick={() => setTab(tabType)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === tabType
                  ? tabType === "expense"
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-success text-white shadow-md shadow-success/25"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface"
              }`}
            >
              {tabType === "expense" ? t("transaction.expense") : t("transaction.income")}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            {t("transaction.amount")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatInputValue(amount)}
            onChange={(e) => setAmount(parseInputValue(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 font-mono text-lg font-semibold text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>

        {/* Merchant */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            {tab === "income" ? t("transaction.income_source") : t("transaction.merchant")}
          </label>
          <input
            type="text"
            placeholder={
              tab === "income"
                ? t("transaction.income_source")
                : t("transaction.merchant")
            }
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>

        {/* Category (expense only) */}
        {tab === "expense" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              {t("transaction.category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(CATEGORY_LABEL_MAP[c] ?? c)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pocket */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            {t("transaction.pocket")}
          </label>
          <select
            value={selectedPocketId}
            onChange={(e) => setSelectedPocketId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          >
            {(["tunai", "ewallet", "rekening"] as const).map((cat) => (
              <optgroup
                key={cat}
                label={
                  cat === "tunai"
                    ? t("transaction.cash")
                    : cat === "ewallet"
                      ? t("transaction.ewallet")
                      : t("transaction.bank_account")
                }
              >
                {pockets
                  .filter((p) => p.category === cat)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <p className="text-xs font-medium text-danger">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("transaction.saving") : t("common.save")}
        </button>
      </form>
    </ResponsiveModal>
  );
}
