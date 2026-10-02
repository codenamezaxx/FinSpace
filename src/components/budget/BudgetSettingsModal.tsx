"use client";

import { useState, useCallback, useEffect } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { useLanguage } from "@/lib/i18n";
import { formatCurrency } from "@/lib/netWorth";

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalIncome: number;
  currentAllocation: { needs: number; wants: number; savings: number };
  onSave: (allocation: { needs: number; wants: number; savings: number }) => void;
}

export function BudgetSettingsModal({
  isOpen,
  onClose,
  totalIncome,
  currentAllocation,
  onSave,
}: BudgetSettingsModalProps) {
  const { t } = useLanguage();
  const [needs, setNeeds] = useState(currentAllocation.needs);
  const [wants, setWants] = useState(currentAllocation.wants);
  const [savings, setSavings] = useState(currentAllocation.savings);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setNeeds(currentAllocation.needs);
      setWants(currentAllocation.wants);
      setSavings(currentAllocation.savings);
    }
  }, [isOpen, currentAllocation]);

  const total = needs + wants + savings;

  const handleSliderChange = useCallback(
    (category: "needs" | "wants" | "savings", newValue: number) => {
      const clamped = Math.max(0, Math.min(100, newValue));
      const others = category === "needs" ? ["wants", "savings"] : category === "wants" ? ["needs", "savings"] : ["needs", "wants"];
      const otherTotal = 100 - clamped;
      const currentOthers = others.reduce((sum, key) => sum + (key === "needs" ? needs : key === "wants" ? wants : savings), 0);

      if (category === "needs") setNeeds(clamped);
      else if (category === "wants") setWants(clamped);
      else setSavings(clamped);

      // Distribute remaining proportionally
      if (currentOthers > 0) {
        const ratio = otherTotal / currentOthers;
        const newWants = others[0] === "wants" ? Math.round(wants * ratio) : Math.round(needs * ratio);
        const newSavings = others[1] === "savings" ? Math.round(savings * ratio) : Math.round(needs * ratio);
        const newNeeds = others[0] === "needs" ? Math.round(needs * ratio) : Math.round(wants * ratio);

        if (others[0] === "wants") setWants(newWants);
        else if (others[0] === "needs") setNeeds(newNeeds);
        else setSavings(newSavings);

        if (others[1] === "savings") setSavings(newSavings);
        else if (others[1] === "needs") setNeeds(newNeeds);
        else setWants(newWants);
      } else {
        // Equal split if others are 0
        const half = Math.round(otherTotal / 2);
        if (others[0] === "wants") setWants(half);
        else if (others[0] === "needs") setNeeds(half);
        else setSavings(half);

        if (others[1] === "savings") setSavings(otherTotal - half);
        else if (others[1] === "needs") setNeeds(otherTotal - half);
        else setWants(otherTotal - half);
      }
    },
    [needs, wants, savings]
  );

  const handleReset = useCallback(() => {
    setNeeds(50);
    setWants(30);
    setSavings(20);
  }, []);

  const handleSave = useCallback(() => {
    onSave({ needs, wants, savings });
  }, [needs, wants, savings, onSave]);

  const needsAmount = Math.round((totalIncome * needs) / 100);
  const wantsAmount = Math.round((totalIncome * wants) / 100);
  const savingsAmount = Math.round((totalIncome * savings) / 100);

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={t("budget.settings_title")}>
      <div className="space-y-6">
        {/* Total Income */}
        <div className="rounded-xl border border-border bg-surface-alt p-4">
          <p className="text-xs font-medium text-text-muted">{t("budget.total_income")}</p>
          <p className="mt-1 font-mono text-lg font-bold text-text-primary">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Sliders */}
        <div className="space-y-5">
          {/* Needs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                {t("budget.needs")}
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{needs}%</span>
                <span className="font-mono text-xs text-text-muted">
                  ({formatCurrency(needsAmount)})
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={needs}
              onChange={(e) => handleSliderChange("needs", Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-text-muted">{t("budget.needs_desc")}</p>
          </div>

          {/* Wants */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                {t("budget.wants")}
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-accent-secondary">{wants}%</span>
                <span className="font-mono text-xs text-text-muted">
                  ({formatCurrency(wantsAmount)})
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={wants}
              onChange={(e) => handleSliderChange("wants", Number(e.target.value))}
              className="w-full accent-accent-secondary"
            />
            <p className="mt-1 text-xs text-text-muted">{t("budget.wants_desc")}</p>
          </div>

          {/* Savings */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                {t("budget.savings")}
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-success">{savings}%</span>
                <span className="font-mono text-xs text-text-muted">
                  ({formatCurrency(savingsAmount)})
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={savings}
              onChange={(e) => handleSliderChange("savings", Number(e.target.value))}
              className="w-full accent-success"
            />
            <p className="mt-1 text-xs text-text-muted">{t("budget.savings_desc")}</p>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl border border-border bg-surface-alt p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-muted">{t("budget.total_allocated")}</p>
            <p className={`font-mono text-sm font-bold ${total === 100 ? "text-success" : "text-danger"}`}>
              {total}%
            </p>
          </div>
          {total !== 100 && (
            <p className="mt-1 text-xs text-danger">{t("budget.total_warning")}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-alt"
          >
            {t("budget.reset_default")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={total !== 100}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
