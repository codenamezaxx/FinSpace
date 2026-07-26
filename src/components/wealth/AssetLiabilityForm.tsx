"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { Plus, Banknote, CreditCard } from "lucide-react";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
import { formatCurrency, formatInputValue, parseInputValue } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";

type ItemType = "asset" | "liability";

interface AssetLiabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: AssetEntry | LiabilityEntry) => void;
  defaultType?: "asset" | "liability";
  onPurchase?: (data: { name: string; amount: number }) => void;
  currentBalance?: number;
}

export function AssetLiabilityForm({
  isOpen,
  onClose,
  onSave,
  defaultType,
  onPurchase,
  currentBalance,
}: AssetLiabilityFormProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<ItemType>("asset");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [assetType, setAssetType] = useState<AssetEntry["type"]>("liquid");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deductFromBalance, setDeductFromBalance] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultType) setType(defaultType);
      setDeductFromBalance(false);
      setName("");
      setAmount("");
      setErrors({});
    }
  }, [isOpen, defaultType]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("wealth.name_required");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = t("wealth.valid_amount");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = Date.now();
    const suffix = `${now}_${crypto.randomUUID().slice(0, 8)}`;
    const parsed = Math.round(Number(amount));

    if (type === "asset") {
      onSave({
        id: `ass${suffix}`,
        name: name.trim(),
        amount: parsed,
        type: assetType,
        createdAt: now,
      } as AssetEntry);
    } else {
      onSave({
        id: `lia${suffix}`,
        name: name.trim(),
        amount: parsed,
        createdAt: now,
      } as LiabilityEntry);
    }

    if (deductFromBalance && onPurchase) {
      onPurchase({ name: name.trim(), amount: parsed });
    }

    setName("");
    setAmount("");
    setErrors({});
    onClose();
  }

  const inputClasses =
    "w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors";

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "asset" ? t("wealth.add_asset") : t("wealth.add_liability")}
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("asset")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 font-mono text-sm font-medium transition-all duration-200 ${
              type === "asset"
                ? "border-primary bg-primary text-white shadow-lg shadow-primary/25"
                : "border-border bg-surface-alt text-text-secondary hover:border-text-muted"
            }`}
          >
            <Banknote className="h-4 w-4" />
            {t("wealth.asset")}
          </button>
          <button
            type="button"
            onClick={() => setType("liability")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 font-mono text-sm font-medium transition-all duration-200 ${
              type === "liability"
                ? "border-danger bg-danger text-white shadow-lg shadow-danger/25"
                : "border-border bg-surface-alt text-text-secondary hover:border-text-muted"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            {t("wealth.liability")}
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.asset_name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("wealth.name_placeholder")}
            className={inputClasses}
          />
          {errors.name && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.name}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("wealth.amount_label")}
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
            <p className="mt-1 font-mono text-xs text-danger">
              {errors.amount}
            </p>
          )}
        </div>

        {/* Asset type - only show for assets */}
        {type === "asset" && (
          <div>
            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("wealth.asset_type")}
            </label>
            <select
              value={assetType}
              onChange={(e) =>
                setAssetType(e.target.value as AssetEntry["type"])
              }
              className={inputClasses}
            >
              <option value="liquid">{t("wealth.liquid")}</option>
              <option value="investment">{t("wealth.investment")}</option>
              <option value="property">{t("wealth.property")}</option>
              <option value="other">{t("wealth.other")}</option>
            </select>
          </div>
        )}

        {/* Buy from Balance */}
        <div className="space-y-3 rounded-xl border border-border bg-surface-alt p-3">
          {currentBalance !== undefined && (
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-text-muted">
                {t("wealth.current_balance")}
              </p>
              <p className="font-mono text-sm font-semibold text-text-primary">
                {formatCurrency(currentBalance)}
              </p>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={deductFromBalance}
              onChange={(e) => setDeductFromBalance(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-text-primary">
              {t("wealth.buy_from_balance")}
            </span>
          </label>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          {t("wealth.add_record")}
        </button>
      </div>
    </ResponsiveModal>
  );
}
