"use client";

import { useState, useMemo, type FC } from "react";
import { Check, X } from "lucide-react";
import type { PocketInfo } from "@/hooks/useFinnyChat";
import { useLanguage } from "@/lib/i18n";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  ASSET_TYPES,
  CATEGORY_LABEL_MAP,
} from "@/lib/constants";

interface TransactionPreviewProps {
  action: string;
  data: Record<string, unknown> | undefined;
  pockets?: PocketInfo[];
  onSave: (action: string, data: Record<string, unknown>) => void;
  onCancel: () => void;
}

const POCKET_CATEGORIES = [
  { value: "ewallet", labelKey: "transaction.ewallet" },
  { value: "rekening", labelKey: "transaction.bank_account" },
  { value: "tunai", labelKey: "transaction.cash" },
];

const TransactionPreview: FC<TransactionPreviewProps> = ({
  action, data, pockets, onSave, onCancel,
}) => {
  const { t } = useLanguage();
  const [editData, setEditData] = useState<Record<string, unknown>>(data ?? {});

  const categories = useMemo(() => {
    if (action === "transaction") {
      return editData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    }
    return [];
  }, [action, editData.type]);

  const groupedPockets = useMemo(() => {
    if (!pockets || pockets.length === 0) return [];
    const cats = ["tunai", "ewallet", "rekening"] as const;
    const labels: Record<string, string> = {
      tunai: t("transaction.cash"),
      ewallet: t("transaction.ewallet"),
      rekening: t("transaction.bank_account"),
    };
    return cats
      .filter((cat) => pockets.some((p) => p.category === cat))
      .map((cat) => ({
        label: labels[cat],
        pockets: pockets.filter((p) => p.category === cat),
      }));
  }, [pockets, t]);

  if (!data) return null;

  const actionLabels: Record<string, string> = {
    transaction: t("transaction.title_add"),
    asset: t("wealth.add_asset"),
    liability: t("wealth.add_liability"),
    debt: t("wealth.add_debt"),
    create_pocket: t("budget.add_pocket"),
  };

  const actionIcons: Record<string, string> = {
    transaction: "💸",
    asset: "📈",
    liability: "📝",
    debt: "💰",
    create_pocket: "👛",
  };

  const label = actionLabels[action] ?? action;
  const icon = actionIcons[action] ?? "💬";

  const updateField = (field: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 mx-4 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>

      {/* Fields — dynamic based on action */}
      <div className="space-y-2.5">
        {/* amount — always shown */}
        <FieldRow
          label={t("transaction.amount")}
          value={
            editData.amount
              ? `Rp${Number(editData.amount).toLocaleString("id-ID")}`
              : ""
          }
          onChange={(v) => updateField("amount", Number(v.replace(/[^0-9]/g, "")))}
          type="currency"
          tFunc={t}
        />

        {/* transaction-specific fields */}
        {action === "transaction" && (
          <>
            <FieldRow
              label={t("transaction.type")}
              value={editData.type === "income" ? t("transaction.income") : t("transaction.expense")}
              onChange={(v) => updateField("type", v === t("transaction.income") ? "income" : "expense")}
              type="select"
              options={[t("transaction.expense"), t("transaction.income")]}
              tFunc={t}
            />
            <FieldRow
              label={t("transaction.merchant")}
              value={(editData.merchant as string) ?? ""}
              onChange={(v) => updateField("merchant", v)}
              type="text"
              tFunc={t}
            />
            <FieldRow
              label={t("transaction.category")}
              value={(editData.category as string) ?? ""}
              onChange={(v) => updateField("category", v)}
              type="select"
              options={categories as string[]}
              tFunc={t}
            />
            {/* Pocket selector */}
            {pockets && pockets.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-muted shrink-0 w-20">
                  {t("transaction.pocket")}
                </span>
                <select
                  value={(editData.pocket_name as string) ?? ""}
                  onChange={(e) => updateField("pocket_name", e.target.value)}
                  className="flex-1 bg-surface-alt text-text-primary text-xs rounded-lg px-2.5 py-1.5 border border-border outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">{t("transaction.select_pocket")}</option>
                  {groupedPockets.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.pockets.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* asset-specific fields */}
        {action === "asset" && (
          <>
            <FieldRow
              label={t("wealth.asset_name")}
              value={(editData.name as string) ?? ""}
              onChange={(v) => updateField("name", v)}
              type="text"
              tFunc={t}
            />
            <FieldRow
              label={t("wealth.asset_type")}
              value={(editData.asset_type as string) ?? ""}
              onChange={(v) => updateField("asset_type", v)}
              type="select"
              options={ASSET_TYPES.map((a) => a.value)}
              optionLabels={ASSET_TYPES.map((a) => t(a.labelKey))}
              tFunc={t}
            />
          </>
        )}

        {/* liability-specific fields */}
        {action === "liability" && (
          <FieldRow
            label={t("wealth.liability_name")}
            value={(editData.name as string) ?? ""}
            onChange={(v) => updateField("name", v)}
            type="text"
            tFunc={t}
          />
        )}

        {/* debt-specific fields */}
        {action === "debt" && (
          <>
            <FieldRow
              label={t("wealth.debt_name")}
              value={(editData.name as string) ?? ""}
              onChange={(v) => updateField("name", v)}
              type="text"
              tFunc={t}
            />
            <FieldRow
              label={t("wealth.debt_paid")}
              value={
                editData.paidAmount
                  ? `Rp${Number(editData.paidAmount).toLocaleString("id-ID")}`
                  : "Rp0"
              }
              onChange={(v) => updateField("paidAmount", Number(v.replace(/[^0-9]/g, "")))}
              type="currency"
              tFunc={t}
            />
            <FieldRow
              label={t("wealth.due_date")}
              value={(editData.dueDate as string) ?? ""}
              onChange={(v) => updateField("dueDate", v)}
              type="text"
              tFunc={t}
            />
            <FieldRow
              label={t("wealth.interest_rate")}
              value={editData.interestRate != null ? String(editData.interestRate) : ""}
              onChange={(v) => updateField("interestRate", v ? Number(v) : null)}
              type="text"
              tFunc={t}
            />
          </>
        )}

        {/* create_pocket-specific fields */}
        {action === "create_pocket" && (
          <>
            <FieldRow
              label={t("budget.pocket_name")}
              value={(editData.name as string) ?? ""}
              onChange={(v) => updateField("name", v)}
              type="text"
              tFunc={t}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted shrink-0 w-20">{t("transaction.category")}</span>
              <select
                value={(editData.category as string) ?? "ewallet"}
                onChange={(e) => updateField("category", e.target.value)}
                className="flex-1 bg-surface-alt text-text-primary text-xs rounded-lg px-2.5 py-1.5 border border-border outline-none focus:ring-1 focus:ring-primary/50"
              >
                {POCKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <FieldRow
              label={t("budget.initial_balance_optional")}
              value={
                editData.initial_balance
                  ? `Rp${Number(editData.initial_balance).toLocaleString("id-ID")}`
                  : "Rp0"
              }
              onChange={(v) => updateField("initial_balance", Number(v.replace(/[^0-9]/g, "")))}
              type="currency"
              tFunc={t}
            />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-alt text-text-secondary text-sm font-medium hover:bg-border transition-colors"
        >
          <X className="w-4 h-4" />
          {t("ai.cancel")}
        </button>
        <button
          onClick={() => onSave(action, editData)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Check className="w-4 h-4" />
          {t("ai.save")}
        </button>
      </div>
    </div>
  );
};

/* ─── FieldRow sub-component ─── */

interface FieldRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: "text" | "select" | "currency";
  options?: string[];
  optionLabels?: string[];
  tFunc: (key: string) => string;
}

const FieldRow: FC<FieldRowProps> = ({ label, value, onChange, type, options, optionLabels, tFunc }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-text-muted shrink-0 w-20">{label}</span>
      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-surface-alt text-text-primary text-xs rounded-lg px-2.5 py-1.5 border border-border outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">{tFunc("common.select")} {label.toLowerCase()}...</option>
          {options.map((opt, i) => (
            <option key={opt} value={opt}>
              {optionLabels?.[i] ?? opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-surface-alt text-text-primary text-xs rounded-lg px-2.5 py-1.5 border border-border outline-none focus:ring-1 focus:ring-primary/50 text-right"
          placeholder={`${tFunc("common.select")} ${label.toLowerCase()}...`}
        />
      )}
    </div>
  );
};

export default TransactionPreview;
