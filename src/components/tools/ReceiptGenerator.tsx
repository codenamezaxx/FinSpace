"use client";

import { useState } from "react";
import { Receipt, Printer, FileDown } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/netWorth";
import { generateReceiptPdf } from "@/lib/receiptPdf";
import { printReceiptHtml } from "@/lib/printReceipt";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ReceiptGenerator() {
  const { transactions } = useTransactions();
  const [selectedId, setSelectedId] = useState<string>("");

  // Sort by timestamp descending, take latest 20
  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  const selectedTransaction = transactions.find((t) => t.id === selectedId);

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
        Cetak Struk
      </h2>

      {/* Transaction Selector */}
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface-alt px-4 py-3 font-mono text-sm text-text-primary outline-none transition-colors duration-200 focus:border-primary"
      >
        <option value="">-- Pilih Transaksi --</option>
        {recentTransactions.map((tx) => (
          <option key={tx.id} value={tx.id}>
            {tx.merchant} - Rp {tx.amount.toLocaleString("id-ID")} ({formatDate(tx.timestamp)})
          </option>
        ))}
      </select>

      {/* Receipt Preview */}
      {selectedTransaction ? (
        <div className="mt-5 border-2 border-dashed border-border rounded-xl p-5">
          <div className="bg-surface-alt rounded-lg p-5 font-mono text-sm">
            {/* Header */}
            <div className="text-center mb-4">
              <p className="font-bold text-base">FINSPACE</p>
              <p className="text-text-muted text-xs">Struk</p>
            </div>

            <div className="border-t border-dashed border-border my-3" />

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Merchant:</span>
                <span className="text-text-primary">{selectedTransaction.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tanggal:</span>
                <span className="text-text-primary">{formatDate(selectedTransaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Kategori:</span>
                <span className="text-text-primary">{selectedTransaction.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Metode:</span>
                <span className="text-text-primary">{selectedTransaction.payment_method}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-border my-3" />

            {/* Total */}
            <div className="flex justify-between items-center text-base font-bold">
              <span>Total:</span>
              <span
                className={
                  selectedTransaction.type === "income"
                    ? "text-success"
                    : "text-danger"
                }
              >
                {formatCurrency(selectedTransaction.amount)}
              </span>
            </div>

            <div className="border-t border-dashed border-border my-3" />

            {/* Footer */}
            <p className="text-center text-text-muted text-xs">Terima kasih!</p>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="mt-5 flex flex-col items-center justify-center gap-3 py-10 text-text-muted">
          <Receipt className="h-12 w-12" />
          <p className="font-mono text-sm">Pilih transaksi untuk mencetak struk</p>
        </div>
      )}

      {/* Action Buttons */}
      {selectedTransaction && (
        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={() => {
              if (selectedTransaction) {
                printReceiptHtml(selectedTransaction);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-mono text-sm font-bold text-white transition-all duration-200 hover:bg-primary-hover"
          >
            <Printer className="h-4 w-4" />
            Cetak struk
          </button>
          <button
            onClick={() => {
              if (selectedTransaction) {
                generateReceiptPdf(selectedTransaction);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-alt px-5 py-3 font-mono text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-surface"
          >
            <FileDown className="h-4 w-4" />
            Unduh PDF
          </button>
        </div>
      )}
    </div>
  );
}
