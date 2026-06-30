"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import type { Pocket } from "@/lib/pocket";
import { formatCurrency } from "@/lib/netWorth";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  pockets: Pocket[];
  balances: Record<string, number>;
  preSelectedFrom?: string | null;
  onTransfer: (fromPocketId: string, toPocketId: string, amount: number) => Promise<void>;
}

export function TransferModal({
  isOpen,
  onClose,
  pockets,
  balances,
  preSelectedFrom,
  onTransfer,
}: TransferModalProps) {
  const [fromId, setFromId] = useState(preSelectedFrom ?? "");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setFromId(preSelectedFrom ?? "");
    setToId("");
    setAmount("");
    setError("");
    onClose();
  };

  const numericAmount = Number(amount) || 0;
  const sourceBalance = fromId ? (balances[fromId] ?? 0) : 0;
  const availableDestinations = pockets.filter((p) => p.id !== fromId);

  const handleSubmit = async () => {
    setError("");

    if (!fromId || !toId) { setError("Pilih kantong sumber dan tujuan."); return; }
    if (fromId === toId) { setError("Kantong sumber dan tujuan harus berbeda."); return; }
    if (numericAmount <= 0) { setError("Jumlah transfer harus lebih dari 0."); return; }

    setLoading(true);
    try {
      await onTransfer(fromId, toId, numericAmount);
      handleClose();
    } catch {
      setError("Gagal melakukan transfer. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={handleClose} title="Pindah Saldo">
      <div className="space-y-4">
        {/* Source pocket */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Dari Kantong</label>
          <select
            value={fromId}
            onChange={(e) => { setFromId(e.target.value); if (toId === e.target.value) setToId(""); }}
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Pilih kantong sumber</option>
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(balances[p.id] ?? 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Arrow icon */}
        <div className="flex justify-center text-text-muted">
          <ArrowRightLeft className="h-5 w-5" />
        </div>

        {/* Destination pocket */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Ke Kantong</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Pilih kantong tujuan</option>
            {availableDestinations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(balances[p.id] ?? 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Jumlah</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {numericAmount > sourceBalance && (
            <p className="mt-1 text-xs text-warning">
              Saldo kantong sumber hanya {formatCurrency(sourceBalance)}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Transfer"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
