"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { Plus, Banknote, CreditCard } from "lucide-react";
import type { AssetEntry, LiabilityEntry } from "@/lib/netWorth";

type ItemType = "asset" | "liability";

interface AssetLiabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: AssetEntry | LiabilityEntry) => void;
}

export function AssetLiabilityForm({
  isOpen,
  onClose,
  onSave,
}: AssetLiabilityFormProps) {
  const [type, setType] = useState<ItemType>("asset");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [assetType, setAssetType] = useState<AssetEntry["type"]>("liquid");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const id = crypto.randomUUID();
    const parsed = Math.round(Number(amount));

    if (type === "asset") {
      onSave({
        id,
        name: name.trim(),
        amount: parsed,
        type: assetType,
      } as AssetEntry);
    } else {
      onSave({ id, name: name.trim(), amount: parsed } as LiabilityEntry);
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
      title={type === "asset" ? "Add Asset" : "Add Liability"}
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
            Asset
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
            Liability
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Savings Account"
            className={inputClasses}
          />
          {errors.name && (
            <p className="mt-1 font-mono text-xs text-danger">{errors.name}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Amount (IDR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
              Asset Type
            </label>
            <select
              value={assetType}
              onChange={(e) =>
                setAssetType(e.target.value as AssetEntry["type"])
              }
              className={inputClasses}
            >
              <option value="liquid">Liquid (Cash, Bank)</option>
              <option value="investment">
                Investment (Stocks, Mutual Funds)
              </option>
              <option value="property">Property (House, Land)</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          Add {type === "asset" ? "Asset" : "Liability"}
        </button>
      </div>
    </ResponsiveModal>
  );
}
