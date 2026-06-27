"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";

const TENOR_OPTIONS = [6, 12, 24, 36, 48, 60];

export function LoanCalculator() {
  const [jumlah, setJumlah] = useState("");
  const [bunga, setBunga] = useState("");
  const [tenor, setTenor] = useState("");

  const parsedJumlah = parseInt(jumlah, 10) || 0;
  const parsedBunga = parseFloat(bunga) || 0;
  const parsedTenor = parseInt(tenor, 10) || 0;

  const result = useMemo(() => {
    if (parsedJumlah <= 0 || parsedTenor <= 0) return null;

    const monthlyRate = parsedBunga > 0 ? (parsedBunga / 100) / 12 : 0;

    if (monthlyRate <= 0) {
      const payment = parsedJumlah / parsedTenor;
      return { payment, totalPayment: parsedJumlah, totalInterest: 0 };
    }

    const powFactor = Math.pow(1 + monthlyRate, parsedTenor);
    const payment =
      (parsedJumlah * (monthlyRate * powFactor)) / (powFactor - 1);
    const totalPayment = payment * parsedTenor;
    const totalInterest = totalPayment - parsedJumlah;

    return { payment, totalPayment, totalInterest };
  }, [parsedJumlah, parsedBunga, parsedTenor]);

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20";

  return (
    <div className="glass rounded-2xl p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-accent-secondary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Kalkulator Pinjaman
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Jumlah Pinjaman */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Jumlah Pinjaman
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            placeholder="Rp 0"
            className={inputClass}
          />
        </div>

        {/* Bunga per Tahun */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Bunga per Tahun
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={bunga}
            onChange={(e) => setBunga(e.target.value)}
            placeholder="12%"
            className={inputClass}
          />
        </div>

        {/* Tenor */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Tenor
          </label>
          <select
            value={tenor}
            onChange={(e) => setTenor(e.target.value)}
            className={inputClass + " appearance-none"}
          >
            <option value="" disabled>
              Pilih tenor
            </option>
            {TENOR_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t} Bulan
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {result ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface-alt/50 p-4">
            {/* Cicilan per Bulan */}
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Cicilan per Bulan
              </p>
              <p className="font-mono text-2xl font-bold text-primary">
                {formatCurrency(Math.round(result.payment))}
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* Total Bunga */}
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Total Bunga
              </p>
              <p className="font-mono text-sm text-text-secondary">
                {formatCurrency(Math.round(result.totalInterest))}
              </p>
            </div>

            {/* Total Pembayaran */}
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                Total Pembayaran
              </p>
              <p className="font-mono text-sm text-text-secondary">
                {formatCurrency(Math.round(result.totalPayment))}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="font-mono text-xs text-text-muted">
              Masukkan jumlah pinjaman dan pilih tenor untuk melihat simulasi
              cicilan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
