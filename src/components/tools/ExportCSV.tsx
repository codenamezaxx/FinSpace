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

/* ─── helpers ─── */

function fmtRp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID");
}

function fmtLabel(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/** Build a single CSV row from an array of strings */
function row(...cells: string[]): string {
  return cells
    .map((c) => {
      if (c.includes(",") || c.includes('"') || c.includes("\n"))
        return `"${c.replace(/"/g, '""')}"`;
      return c;
    })
    .join(",");
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

  /* ── Computed aggregates ── */

  const incomeAgg = useMemo(() => {
    const items = transactions.filter((t) => t.type === "income");
    const total = items.reduce((s, t) => s + t.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const t of items) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
    return { total, byCategory };
  }, [transactions]);

  const expenseAgg = useMemo(() => {
    const items = transactions.filter((t) => t.type === "expense");
    const total = items.reduce((s, t) => s + t.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const t of items) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
    return { total, byCategory };
  }, [transactions]);

  /* ── Download ── */

  const handleDownload = () => {
    const monthName = INDONESIAN_MONTHS[selectedMonth - 1];
    const nowStr = fmtDate(Date.now());
    const blank = "";
    const grandTotal = incomeAgg.total + expenseAgg.total;

    const lines: string[] = [];

    // ── 1. HEADER ──
    lines.push(row("LAPORAN KEUANGAN BULANAN", "", "", ""));
    lines.push(row(`Periode: ${monthName} ${selectedYear}`, "", "", ""));
    lines.push(row(`Dibuat: ${nowStr}`, "", "", ""));
    lines.push(blank);

    // ── 2. RINGKASAN ──
    lines.push(row("RINGKASAN KEUANGAN"));
    lines.push(row("", "", "", "", "", ""));
    const incomePct = grandTotal > 0 ? ((incomeAgg.total / grandTotal) * 100).toFixed(1) : "0";
    const expensePct = grandTotal > 0 ? ((expenseAgg.total / grandTotal) * 100).toFixed(1) : "0";
    lines.push(row("Pemasukan", fmtRp(incomeAgg.total), incomePct + "%", "", "", ""));
    lines.push(row("Pengeluaran", fmtRp(expenseAgg.total), expensePct + "%", "", "", ""));
    lines.push(blank);
    const net = incomeAgg.total - expenseAgg.total;
    lines.push(
      row(
        "Saldo Bersih",
        fmtRp(net),
        net >= 0 ? "Surplus" : "Defisit",
        "", "", ""
      )
    );
    lines.push(
      row(
        "Jumlah Transaksi",
        `${transactions.length} transaksi`,
        "", "", "", ""
      )
    );
    lines.push(blank);
    lines.push(blank);

    // ── 3. PEMASUKAN PER KATEGORI ──
    if (incomeAgg.total > 0) {
      lines.push(row("RINCIAN PEMASUKAN PER KATEGORI"));
      lines.push(blank);
      lines.push(row("Kategori", "Jumlah", "Persentase", "", "", ""));
      const sortedIncome = Object.entries(incomeAgg.byCategory).sort(
        (a, b) => b[1] - a[1]
      );
      for (const [cat, amt] of sortedIncome) {
        const pct = ((amt / incomeAgg.total) * 100).toFixed(1);
        lines.push(row(fmtLabel(cat), fmtRp(amt), `${pct}%`, "", "", ""));
      }
      lines.push(
        row(
          "TOTAL PEMASUKAN",
          fmtRp(incomeAgg.total),
          "100%",
          "", "", ""
        )
      );
      lines.push(blank);
      lines.push(blank);
    }

    // ── 4. PENGELUARAN PER KATEGORI ──
    if (expenseAgg.total > 0) {
      lines.push(row("RINCIAN PENGELUARAN PER KATEGORI"));
      lines.push(blank);
      lines.push(row("Kategori", "Jumlah", "Persentase", "", "", ""));
      const sortedExpense = Object.entries(expenseAgg.byCategory).sort(
        (a, b) => b[1] - a[1]
      );
      for (const [cat, amt] of sortedExpense) {
        const pct = ((amt / expenseAgg.total) * 100).toFixed(1);
        lines.push(row(fmtLabel(cat), fmtRp(amt), `${pct}%`, "", "", ""));
      }
      lines.push(
        row(
          "TOTAL PENGELUARAN",
          fmtRp(expenseAgg.total),
          "100%",
          "", "", ""
        )
      );
      lines.push(blank);
      lines.push(blank);
    }

    // ── 5. TRANSAKSI TERBESAR ──
    const topExpenses = [...transactions]
      .filter((t) => t.type === "expense")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    if (topExpenses.length > 0) {
      lines.push(row("5 PENGELUARAN TERBESAR"));
      lines.push(blank);
      lines.push(
        row("No", "Tanggal", "Merchant", "Kategori", "Jumlah", "", "")
      );
      topExpenses.forEach((t, i) => {
        lines.push(
          row(
            String(i + 1),
            fmtDate(t.timestamp),
            fmtLabel(t.merchant),
            fmtLabel(t.category),
            fmtRp(t.amount),
            "", ""
          )
        );
      });
      lines.push(blank);
      lines.push(blank);
    }

    // ── 6. RINCIAN TRANSAKSI ──
    lines.push(row("RINCIAN TRANSAKSI"));
    lines.push(blank);
    lines.push(
      row(
        "No",
        "Tanggal",
        "Tipe",
        "Kategori",
        "Merchant",
        "Jumlah",
        "Pembayaran"
      )
    );
    const sorted = [...transactions].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    sorted.forEach((t, i) => {
      const tipeLabel = t.type === "income" ? "Pemasukan" : "Pengeluaran";
      lines.push(
        row(
          String(i + 1),
          fmtDate(t.timestamp),
          tipeLabel,
          fmtLabel(t.category),
          fmtLabel(t.merchant),
          t.type === "income" ? fmtRp(t.amount) : `(${fmtRp(t.amount)})`,
          fmtLabel(t.payment_method)
        )
      );
    });
    lines.push(blank);
    lines.push(blank);

    // ── 7. FOOTER ──
    lines.push(row(`— Akhir Laporan — ${monthName} ${selectedYear} —`));

    // ── Build blob & download ──
    // Use UTF-8 BOM so Excel opens Indonesian characters correctly
    const bom = "\uFEFF";
    const csv = bom + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `FinSpace_Laporan_${monthName}_${selectedYear}.csv`;
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
