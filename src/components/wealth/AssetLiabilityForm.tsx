"use client";

import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { Plus, Banknote, CreditCard } from "lucide-react";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";
import { formatCurrency, formatInputValue, parseInputValue } from "@/lib/netWorth";
import { useLanguage } from "@/lib/i18n";
import { usePockets } from "@/hooks/usePockets";
import { newAssetId, newLiabilityId } from "@/lib/ids";

type ItemType = "asset" | "liability";

interface AssetLiabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: AssetEntry | LiabilityEntry) => void;
  defaultType?: "asset" | "liability";
  onPurchase?: (data: { name: string; amount: number; pocketId?: string }) => void;
  currentBalance?: number;
  /** When set, the form works in edit mode: fields are prefilled and the original id/createdAt are preserved on save. */
  initialItem?: AssetEntry | LiabilityEntry;
}

export function AssetLiabilityForm({
  isOpen,
  onClose,
  onSave,
  defaultType,
  onPurchase,
  currentBalance,
  initialItem,
}: AssetLiabilityFormProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<ItemType>("asset");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [assetType, setAssetType] = useState<AssetEntry["type"]>("liquid");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deductFromBalance, setDeductFromBalance] = useState(false);
  const [purchasePocketId, setPurchasePocketId] = useState("");
  const { pockets, balances } = usePockets();

  const isEditing = !!initialItem;

  // Reset (add mode) or prefill (edit mode) state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setType("type" in initialItem ? "asset" : "liability");
        setName(initialItem.name);
        setAmount(String(initialItem.amount));
        if ("type" in initialItem) setAssetType(initialItem.type);
      } else {
        if (defaultType) setType(defaultType);
        setName("");
        setAmount("");
      }
      setDeductFromBalance(false);
      setPurchasePocketId("");
      setErrors({});
    }
  }, [isOpen, defaultType, initialItem]);

  // Default purchase pocket (Tunai first) once pockets load
  useEffect(() => {
    if (isOpen && !purchasePocketId && pockets.length > 0) {
      setPurchasePocketId(
        pockets.find((p) => p.name === "Tunai")?.id ?? pockets[0].id
      );
    }
  }, [isOpen, purchasePocketId, pockets]);

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
    const parsed = Math.round(Number(amount));
    // Edit mode: keep the original id + createdAt so `put` updates in place
    // (new id would duplicate, new createdAt would reorder history).
    const prevId = initialItem?.id;
    const prevCreatedAt =
      initialItem && "createdAt" in initialItem
        ? (initialItem.createdAt as number | undefined)
        : undefined;

    if (type === "asset") {
      onSave({
        id: prevId ?? newAssetId(),
        name: name.trim(),
        amount: parsed,
        type: assetType,
        createdAt: prevCreatedAt ?? now,
      } as AssetEntry);
    } else {
      onSave({
        id: prevId ?? newLiabilityId(),
        name: name.trim(),
        amount: parsed,
        createdAt: prevCreatedAt ?? now,
      } as LiabilityEntry);
    }

    if (deductFromBalance && onPurchase) {
      onPurchase({
        name: name.trim(),
        amount: parsed,
        pocketId: purchasePocketId || undefined,
      });
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
      title={
        isEditing
          ? type === "asset"
            ? t("wealth.edit_asset")
            : t("wealth.edit_liability")
          : type === "asset"
            ? t("wealth.add_asset")
            : t("wealth.add_liability")
      }
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("asset")}
            disabled={isEditing}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 font-mono text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
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
            disabled={isEditing}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 font-mono text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
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

        {/* Buy from Balance — add mode only */}
        {!isEditing && (
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
          {deductFromBalance && (
            <div>
              <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("budget.transfer_from")}
              </label>
              <select
                value={purchasePocketId}
                onChange={(e) => setPurchasePocketId(e.target.value)}
                className={inputClasses}
              >
                {pockets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(balances[p.id] ?? 0)}
                  </option>
                ))}
              </select>
              {Number(amount || 0) > (balances[purchasePocketId] ?? 0) && (
                <p className="mt-1 font-mono text-xs text-warning">
                  {t("transfer.insufficient_balance", {
                    pocket:
                      pockets.find((p) => p.id === purchasePocketId)?.name ?? "",
                    balance: formatCurrency(balances[purchasePocketId] ?? 0),
                  })}
                </p>
              )}
            </div>
          )}
        </div>
        )}

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
