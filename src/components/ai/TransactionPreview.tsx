"use client";

import { useState, useMemo, type FC } from "react";
import { Check, X } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Makanan & Minuman", "Transportasi", "Tagihan", "Kesehatan",
  "Pendidikan", "Belanja", "Hiburan",
];

const INCOME_CATEGORIES = ["Gaji", "Freelance", "Investasi"];

const PAYMENT_METHODS = [
  "Cash", "Transfer Bank", "QRIS", "Kartu Kredit",
  "Kartu Debit", "E-Wallet", "Lainnya",
];

const ASSET_TYPES = [
  { value: "liquid", label: "Liquid (Tabungan/Kas)" },
  { value: "investment", label: "Investasi (Saham/Emas/Reksadana)" },
  { value: "property", label: "Properti (Rumah/Tanah)" },
  { value: "other", label: "Lainnya (Kendaraan/dll)" },
];

interface TransactionPreviewProps {
  action: string;
  data: Record<string, unknown> | undefined;
  onSave: (action: string, data: Record<string, unknown>) => void;
  onCancel: () => void;
}

const actionLabels: Record<string, string> = {
  transaction: "Transaksi",
  asset: "Aset",
  liability: "Liabilitas",
  debt: "Utang",
};

const actionIcons: Record<string, string> = {
  transaction: "💸",
  asset: "📈",
  liability: "📝",
  debt: "💰",
};

const TransactionPreview: FC<TransactionPreviewProps> = ({
  action, data, onSave, onCancel,
}) => {
  const [editData, setEditData] = useState<Record<string, unknown>>(data ?? {});

  const categories = useMemo(() => {
    if (action === "transaction") {
      return editData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    }
    return [];
  }, [action, editData.type]);

  if (!data) return null;

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
          label="Jumlah"
          value={
            editData.amount
              ? `Rp${Number(editData.amount).toLocaleString("id-ID")}`
              : ""
          }
          onChange={(v) => updateField("amount", Number(v.replace(/[^0-9]/g, "")))}
          type="currency"
        />

        {/* transaction-specific fields */}
        {action === "transaction" && (
          <>
            <FieldRow
              label="Tipe"
              value={editData.type === "income" ? "Pemasukan" : "Pengeluaran"}
              onChange={(v) => updateField("type", v === "Pemasukan" ? "income" : "expense")}
              type="select"
              options={["Pengeluaran", "Pemasukan"]}
            />
            <FieldRow
              label="Merchant"
              value={(editData.merchant as string) ?? ""}
              onChange={(v) => updateField("merchant", v)}
              type="text"
            />
            <FieldRow
              label="Kategori"
              value={(editData.category as string) ?? ""}
              onChange={(v) => updateField("category", v)}
              type="select"
              options={categories}
            />
            <FieldRow
              label="Pembayaran"
              value={(editData.payment_method as string) ?? ""}
              onChange={(v) => updateField("payment_method", v)}
              type="select"
              options={PAYMENT_METHODS}
            />
          </>
        )}

        {/* asset-specific fields */}
        {action === "asset" && (
          <>
            <FieldRow
              label="Nama Aset"
              value={(editData.name as string) ?? ""}
              onChange={(v) => updateField("name", v)}
              type="text"
            />
            <FieldRow
              label="Jenis Aset"
              value={(editData.asset_type as string) ?? ""}
              onChange={(v) => updateField("asset_type", v)}
              type="select"
              options={ASSET_TYPES.map((a) => a.value)}
              optionLabels={ASSET_TYPES.map((a) => a.label)}
            />
          </>
        )}

        {/* liability-specific fields */}
        {action === "liability" && (
          <FieldRow
            label="Nama Liabilitas"
            value={(editData.name as string) ?? ""}
            onChange={(v) => updateField("name", v)}
            type="text"
          />
        )}

        {/* debt-specific fields */}
        {action === "debt" && (
          <>
            <FieldRow
              label="Nama Utang"
              value={(editData.name as string) ?? ""}
              onChange={(v) => updateField("name", v)}
              type="text"
            />
            <FieldRow
              label="Terbayar"
              value={
                editData.paidAmount
                  ? `Rp${Number(editData.paidAmount).toLocaleString("id-ID")}`
                  : "Rp0"
              }
              onChange={(v) => updateField("paidAmount", Number(v.replace(/[^0-9]/g, "")))}
              type="currency"
            />
            <FieldRow
              label="Jatuh Tempo"
              value={(editData.dueDate as string) ?? ""}
              onChange={(v) => updateField("dueDate", v)}
              type="text"
            />
            <FieldRow
              label="Bunga (%/tahun)"
              value={editData.interestRate != null ? String(editData.interestRate) : ""}
              onChange={(v) => updateField("interestRate", v ? Number(v) : null)}
              type="text"
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
          Batal
        </button>
        <button
          onClick={() => onSave(action, editData)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Check className="w-4 h-4" />
          Simpan
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
}

const FieldRow: FC<FieldRowProps> = ({ label, value, onChange, type, options, optionLabels }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-text-muted shrink-0 w-20">{label}</span>
      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-surface-alt text-text-primary text-xs rounded-lg px-2.5 py-1.5 border border-border outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">Pilih {label.toLowerCase()}...</option>
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
          placeholder={`Masukkan ${label.toLowerCase()}...`}
        />
      )}
    </div>
  );
};

export default TransactionPreview;
