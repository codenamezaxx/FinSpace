"use client";

import { useEffect, useState } from "react";
import { ResponsiveModal } from "./ResponsiveModal";
import { useTransactionModal } from "@/lib/transaction-modal-context";
import { useTransactions } from "@/hooks/useTransactions";

const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
];

const PAYMENT_METHODS = ["Tunai", "Transfer Bank", "Kartu Kredit", "E-Wallet"];

export function GlobalTransactionModal() {
  const { isOpen, closeAddTransaction, initialTab } = useTransactionModal();
  const { addTransaction } = useTransactions();

  const [tab, setTab] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setAmount("");
      setMerchant("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setError("");
    }
  }, [isOpen, initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }
    if (!merchant.trim()) {
      setError(
        tab === "income"
          ? "Masukkan asal pemasukkan."
          : "Masukkan tujuan pengeluaran."
      );
      return;
    }

    setSubmitting(true);
    try {
      await addTransaction({
        amount: numAmount,
        type: tab,
        category: tab === "income" ? "Pemasukkan" : category,
        merchant: merchant.trim(),
        payment_method: paymentMethod,
      });
      closeAddTransaction();
    } catch {
      setError("Gagal menyimpan transaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={closeAddTransaction}
      title="Tambah Transaksi"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Tab Toggle ── */}
        <div className="flex rounded-xl border border-border bg-surface-alt p-1">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === t
                  ? t === "expense"
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-success text-white shadow-md shadow-success/25"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface"
              }`}
            >
              {t === "expense" ? "Pengeluaran" : "Pemasukkan"}
            </button>
          ))}
        </div>

        {/* ── Amount ── */}
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

        {/* ── Merchant / Source (label changes per tab) ── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            {tab === "income" ? "Asal Pemasukkan" : "Tujuan Pengeluaran"}
          </label>
          <input
            type="text"
            placeholder={
              tab === "income"
                ? "Contoh: Gaji, Freelance"
                : "Nama toko atau merchant"
            }
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>

        {/* ── Category (expense only) ── */}
        {tab === "expense" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Jenis Pengeluaran
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Payment Method ── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Metode Pembayaran
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* ── Error ── */}
        {error && <p className="text-xs font-medium text-danger">{error}</p>}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </form>
    </ResponsiveModal>
  );
}
