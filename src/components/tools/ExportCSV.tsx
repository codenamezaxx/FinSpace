"use client";

import { useState, useMemo } from "react";
import { Download, FileDown } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const YEARS = Array.from(
  { length: CURRENT_YEAR - 2024 + 1 },
  (_, i) => 2024 + i
);

function toCSVValue(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportCSV() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const startTime = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1).getTime(),
    [selectedMonth, selectedYear]
  );

  const endTime = useMemo(
    () =>
      new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).getTime(),
    [selectedMonth, selectedYear]
  );

  const { transactions } = useTransactions({ startTime, endTime });

  const handleDownload = () => {
    const header = "ID,Type,Amount,Category,Merchant,Payment Method,Date";
    const rows = transactions.map((t) =>
      [
        toCSVValue(t.id),
        toCSVValue(t.type),
        t.amount,
        toCSVValue(t.category),
        toCSVValue(t.merchant),
        toCSVValue(t.payment_method),
        toCSVValue(new Date(t.timestamp).toLocaleDateString("id-ID")),
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `finspace-transaksi-${selectedMonth}-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Ekspor Data
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Bulan */}
        <div>
          <label
            htmlFor="export-bulan"
            className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted"
          >
            Bulan
          </label>
          <select
            id="export-bulan"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors focus:border-primary"
          >
            {INDONESIAN_MONTHS.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun */}
        <div>
          <label
            htmlFor="export-tahun"
            className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted"
          >
            Tahun
          </label>
          <select
            id="export-tahun"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors focus:border-primary"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info */}
      {transactions.length > 0 && (
        <p className="mt-3 font-mono text-xs text-text-muted">
          {transactions.length.toLocaleString("id-ID")} transaksi ditemukan
        </p>
      )}

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
            <FileDown className="h-5 w-5 text-text-muted" />
          </div>
          <p className="mt-3 text-sm text-text-muted">
            Belum ada transaksi di periode ini
          </p>
        </div>
      )}

      {/* Download */}
      {transactions.length > 0 && (
        <button
          onClick={handleDownload}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-mono text-sm font-bold text-white transition-all duration-200 hover:bg-primary-hover"
        >
          <Download className="h-4 w-4" />
          Unduh CSV
        </button>
      )}
    </div>
  );
}
