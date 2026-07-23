"use client";

import { useState, useMemo } from "react";
import { Download, FileDown, FileText } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { generateMonthlyReportPdf } from "@/lib/monthlyReportPdf";

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

/* ─── helpers ─── */

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID");
}

/** Escape a single cell value for CSV */
function csvCell(v: string | number): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/* ─── component ─── */

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

  /* ── CSV Download ── */

  const handleDownloadCsv = () => {
    const header = ["Tanggal", "Tipe", "Kategori", "Merchant", "Jumlah", "Metode Pembayaran"];
    const rows = [...transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((t) =>
        [
          fmtDate(t.timestamp),
          t.type === "income" ? "Pemasukan" : "Pengeluaran",
          t.category,
          t.merchant,
          t.amount,
          t.payment_method,
        ]
          .map((c) => csvCell(c))
          .join(",")
      );

    const bom = "\uFEFF";
    const csv = bom + [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `FinSpace_Transaksi_${INDONESIAN_MONTHS[selectedMonth - 1]}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ── PDF Download ── */

  const handleDownloadPdf = () => {
    generateMonthlyReportPdf(transactions, selectedMonth, selectedYear);
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

      {/* Buttons */}
      {transactions.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          <button
            onClick={handleDownloadCsv}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-alt px-5 py-3 font-mono text-sm font-bold text-text-primary transition-all duration-200 hover:bg-border"
          >
            <Download className="h-4 w-4 text-text-muted" />
            Unduh CSV
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-mono text-sm font-bold text-white transition-all duration-200 hover:bg-primary-hover"
          >
            <FileText className="h-4 w-4" />
            Unduh PDF Laporan
          </button>
        </div>
      )}
    </div>
  );
}
