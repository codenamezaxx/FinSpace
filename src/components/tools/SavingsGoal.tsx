"use client";

import { useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";
import { formatCurrency, formatInputValue, parseInputValue } from "@/lib/netWorth";

export function SavingsGoal() {
  const [target, setTarget] = useState("");
  const [waktu, setWaktu] = useState("");
  const [saldoAwal, setSaldoAwal] = useState("");

  const targetNum = parseFloat(target) || 0;
  const waktuNum = parseInt(waktu, 10) || 0;
  const saldoAwalNum = parseFloat(saldoAwal) || 0;

  const monthly = useMemo(() => {
    if (targetNum <= 0 || waktuNum <= 0) return 0;
    return (targetNum - saldoAwalNum) / waktuNum;
  }, [targetNum, waktuNum, saldoAwalNum]);

  const showResult = targetNum > 0 && waktuNum > 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-5 flex items-center gap-2">
        <PiggyBank className="h-4 w-4 text-accent" />
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Kalkulator Tabungan
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-secondary">
            Target Jumlah
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatInputValue(target)}
            onChange={(e) => setTarget(parseInputValue(e.target.value))}
            placeholder="Rp 0"
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-secondary">
            Waktu
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={waktu}
            onChange={(e) => setWaktu(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="12 bulan"
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs text-text-secondary">
            Saldo Awal <span className="text-text-muted">(opsional)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatInputValue(saldoAwal)}
            onChange={(e) => setSaldoAwal(parseInputValue(e.target.value))}
            placeholder="Rp 0"
            className="w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border/50 bg-surface-alt/50 p-4">
        {showResult ? (
          <div className="text-center">
            <p className="font-mono text-xs text-text-muted">
              Tabungan per Bulan
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-accent">
              {formatCurrency(Math.round(monthly))}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              selama {waktuNum} bulan
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-text-muted">
            Masukkan target jumlah dan waktu untuk melihat estimasi tabungan
          </p>
        )}
      </div>
    </div>
  );
}
