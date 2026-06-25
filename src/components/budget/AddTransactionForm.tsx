"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { useTransactions } from "@/hooks/useTransactions";

interface AddTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
  "Gaji",
  "Freelance",
  "Investasi",
];

const PAYMENT_METHODS = ["Cash", "Transfer Bank", "Kartu Kredit", "E-Wallet"];

export function AddTransactionForm({ isOpen, onClose }: AddTransactionFormProps) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }
    if (!merchant.trim()) {
      setError("Masukkan nama merchant.");
      return;
    }

    setSubmitting(true);
    try {
      await addTransaction({
        amount: numAmount,
        type,
        category,
        merchant: merchant.trim(),
        payment_method: paymentMethod,
      });
      setAmount("");
      setMerchant("");
      setCategory(CATEGORIES[0]);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setType("expense");
      onClose();
    } catch {
      setError("Gagal menyimpan transaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Tambah Transaksi">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle */}
        <div className="flex rounded-xl border border-border bg-surface-alt p-1">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                type === t
                  ? t === "expense"
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-success text-white shadow-md shadow-success/25"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface"
              }`}
            >
              {t === "expense" ? "Pengeluaran" : "Pemasukan"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Jumlah (Rp)
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 font-mono text-lg font-semibold text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>

        {/* Merchant */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Merchant
          </label>
          <input
            type="text"
            placeholder="Nama toko atau merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Metode Pembayaran
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors appearance-none"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs font-medium text-danger">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </form>
    </ResponsiveModal>
  );
}
