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

type Bucket = "needs" | "wants" | "savings";

const BUCKET_META: Record<Bucket, { labelKey: string; descKey: string; color: string }> = {
  needs: { labelKey: "budget.needs", descKey: "budget.needs_desc", color: "#3B82F6" },
  wants: { labelKey: "budget.wants", descKey: "budget.wants_desc", color: "#723EC3" },
  savings: { labelKey: "budget.savings", descKey: "budget.savings_desc", color: "#22C55E" },
};

function BudgetSliderRow({
  bucket,
  value,
  amount,
  totalIncome,
  onChange,
  t,
}: {
  bucket: Bucket;
  value: number;
  amount: number;
  totalIncome: number;
  onChange: (v: number) => void;
  t: (key: string) => string;
}) {
  const meta = BUCKET_META[bucket];

  // Draft text while the nominal field is focused (null = show computed amount).
  // Committed to a percentage on blur / Enter, so typing "1000000"
  // digit-by-digit doesn't thrash the other sliders mid-typing.
  const [draft, setDraft] = useState<string | null>(null);

  const commitNominal = () => {
    if (draft === null) return;
    const digits = draft.replace(/[^0-9]/g, "");
    const nominal = digits === "" ? 0 : Number(digits);
    if (totalIncome > 0) onChange(Math.round((nominal / totalIncome) * 100));
    setDraft(null);
  };

  const handleInputChange = (raw: string) => {
    if (raw === "") {
      onChange(0);
      return;
    }
    const n = Math.round(Number(raw));
    if (!Number.isNaN(n)) onChange(Math.max(0, Math.min(100, n)));
  };

  return (
    <div className="rounded-xl border border-border bg-surface-alt p-4 transition-colors focus-within:border-primary/40">
      {/* Header: dot + label + amount */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {t(meta.labelKey)}
            </p>
            <p className="truncate text-xs text-text-muted">{t(meta.descKey)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
            <input
              type="number"
              min={0}
              max={100}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              aria-label={t(meta.labelKey)}
              className="w-11 bg-transparent text-center font-mono text-sm font-bold text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="font-mono text-xs text-text-muted">%</span>
          </div>
        </div>
      </div>

      {/* Nominal amount (editable — commits to % on blur / Enter) */}
      <div className="mb-2.5 flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
          <span className="font-mono text-xs text-text-muted">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft ?? amount.toLocaleString("id-ID")}
            onFocus={(e) => {
              setDraft(String(amount));
              requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitNominal}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            aria-label={`${t(meta.labelKey)} nominal`}
            className="w-28 bg-transparent text-right font-mono text-xs text-text-primary outline-none"
          />
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={t(meta.labelKey)}
        className="budget-slider w-full"
        style={
          {
            "--slider-color": meta.color,
            background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${value}%, rgba(148,163,184,0.25) ${value}%, rgba(148,163,184,0.25) 100%)`,
          } as React.CSSProperties
        }
      />
    </div>
  );
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
  const isValid = total === 100;

  const handleSliderChange = useCallback(
    (category: Bucket, newValue: number) => {
      const clamped = Math.max(0, Math.min(100, newValue));
      const others: Bucket[] =
        category === "needs"
          ? ["wants", "savings"]
          : category === "wants"
            ? ["needs", "savings"]
            : ["needs", "wants"];
      const otherTotal = 100 - clamped;
      const get = (b: Bucket) => (b === "needs" ? needs : b === "wants" ? wants : savings);
      const set = (b: Bucket, v: number) => {
        if (b === "needs") setNeeds(v);
        else if (b === "wants") setWants(v);
        else setSavings(v);
      };

      set(category, clamped);

      // Distribute the remainder proportionally across the other two
      const currentOthers = get(others[0]) + get(others[1]);
      if (currentOthers > 0) {
        const ratio = otherTotal / currentOthers;
        let first = Math.round(get(others[0]) * ratio);
        first = Math.max(0, Math.min(otherTotal, first));
        set(others[0], first);
        set(others[1], otherTotal - first);
      } else {
        // Equal split when the others are both zero
        const half = Math.round(otherTotal / 2);
        set(others[0], half);
        set(others[1], otherTotal - half);
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

  const values: Record<Bucket, number> = { needs, wants, savings };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={t("budget.settings_title")}>
      <style>{`
        .budget-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        .budget-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: var(--slider-color);
          border: 3px solid #fff;
          box-shadow: 0 1px 5px rgba(0,0,0,0.45);
          cursor: grab;
          transition: transform 0.15s ease;
        }
        .budget-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .budget-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.05);
        }
        .budget-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: var(--slider-color);
          border: 3px solid #fff;
          box-shadow: 0 1px 5px rgba(0,0,0,0.45);
          cursor: grab;
        }
        .budget-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          background: transparent;
        }
        .budget-slider::-moz-range-progress {
          background: var(--slider-color);
          height: 6px;
          border-radius: 9999px;
        }
      `}</style>

      <div className="space-y-4">
        {/* Total Income */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-alt px-4 py-3">
          <p className="text-xs font-medium text-text-muted">{t("budget.total_income")}</p>
          <p className="font-mono text-base font-bold text-text-primary">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Sliders with numeric inputs */}
        {(["needs", "wants", "savings"] as Bucket[]).map((bucket) => (
          <BudgetSliderRow
            key={`${bucket}-${isOpen}`}
            bucket={bucket}
            value={values[bucket]}
            amount={Math.round((totalIncome * values[bucket]) / 100)}
            totalIncome={totalIncome}
            onChange={(v) => handleSliderChange(bucket, v)}
            t={t}
          />
        ))}

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-alt px-4 py-3">
          <p className="text-xs font-medium text-text-muted">{t("budget.total_allocated")}</p>
          <p className={`font-mono text-sm font-bold ${isValid ? "text-success" : "text-danger"}`}>
            {total}%
          </p>
        </div>
        {!isValid && (
          <p className="-mt-2 text-xs text-danger">{t("budget.total_warning")}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-alt"
          >
            {t("budget.reset_default")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
