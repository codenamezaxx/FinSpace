"use client";

import { Pencil, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";
import { usePockets } from "@/hooks/usePockets";
import { formatCurrency } from "@/lib/netWorth";
import type { Transaction } from "@/lib/db";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

function formatDateFull(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
}: TransactionDetailModalProps) {
  const { pockets } = usePockets();
  if (!transaction) return null;

  const isExpense = transaction.type === "expense";
  const pocket = pockets.find((p) => p.id === transaction.pocketId);

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Detail Transaksi">
      <div className="space-y-5">
        {/* Header: Type Badge */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isExpense
                ? "bg-danger/10 text-danger"
                : "bg-success/10 text-success"
            }`}
          >
            {isExpense ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            {isExpense ? "Pengeluaran" : "Pemasukan"}
          </span>
        </div>

        {/* Amount */}
        <div className="text-center">
          <p
            className={`font-mono text-3xl font-bold ${
              isExpense ? "text-danger" : "text-success"
            }`}
          >
            {isExpense ? "-" : "+"}
            {formatCurrency(transaction.amount)}
          </p>
        </div>

        {/* Merchant */}
        <div className="text-center">
          <p className="text-base font-medium text-text-primary">
            {transaction.merchant}
          </p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 rounded-xl bg-surface-alt p-4">
          <DetailRow
            label="Kategori"
            value={transaction.category}
          />
          <DetailRow
            label="Kantong / Metode Pembayaran"
            value={pocket?.name ?? transaction.payment_method}
          />
          <DetailRow
            label="Tanggal"
            value={formatDateFull(transaction.timestamp)}
          />
          <DetailRow
            label="ID Transaksi"
            value={transaction.id}
            mono
            muted
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              onEdit(transaction);
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover active:scale-[0.97]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(transaction);
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-danger/90 active:scale-[0.97]"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">{label}</span>
      <span
        className={`text-right text-sm ${
          mono ? "font-mono text-xs" : "font-medium"
        } ${muted ? "text-text-muted" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}
