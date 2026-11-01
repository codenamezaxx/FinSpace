"use client";

import { useState, useMemo } from "react";
import { Download, FileDown, FileText, Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { usePockets } from "@/hooks/usePockets";
import { generateMonthlyReportPdf, type SavePdfResult } from "@/lib/monthlyReportPdf";
import { useLanguage } from "@/lib/i18n";

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

/* ─── Simple toast notification ─── */

interface Toast {
  message: string;
  type: "success" | "error" | "info";
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (idx: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, idx) => (
        <div
          key={idx}
          className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg border transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-600 text-white border-green-500"
              : toast.type === "error"
              ? "bg-red-600 text-white border-red-500"
              : "bg-blue-600 text-white border-blue-500"
          }`}
          role="alert"
        >
          {toast.type === "success" && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.type === "info" && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />}
          <span className="font-mono text-sm">{toast.message}</span>
          <button
            onClick={() => onDismiss(idx)}
            className="ml-2 flex-shrink-0 text-white/80 hover:text-white transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── component ─── */

export function ExportCSV() {
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
  const { pockets } = usePockets();

  const showToast = (message: string, type: Toast["type"] = "info") => {
    const newToast = { message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((_, i) => i !== 0));
    }, 4000);
  };

  const dismissToast = (idx: number) => {
    setToasts((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ── CSV Download ── */

  const handleDownloadCsv = () => {
    const header = [
      t("transaction.date"),
      t("transaction.type"),
      t("transaction.category"),
      t("transaction.merchant"),
      t("transaction.amount"),
      t("transaction.payment_method"),
    ];
    const rows = [...transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((tx) =>
        [
          fmtDate(tx.timestamp),
          tx.type === "income" ? t("transaction.income") : t("transaction.expense"),
          tx.category,
          tx.merchant,
          tx.amount,
          tx.payment_method,
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
    const months = t("tools.months_array").split(",");
    link.download = `FinSpace_Transaksi_${months[selectedMonth - 1]}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(t("tools.csv_downloaded") ?? "CSV downloaded", "success");
  };

  /* ── PDF Download ── */

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    showToast(t("tools.generating_report") ?? "Generating report...", "info");

    try {
      const result: SavePdfResult = await generateMonthlyReportPdf(
        transactions,
        selectedMonth,
        selectedYear,
        t,
        pockets ?? []
      );

      if (result.success) {
        const fileName = result.filePath ?? `FinSpace_Report_${selectedMonth}_${selectedYear}.pdf`;
        showToast(`${t("tools.report_saved") ?? "Report saved"}: ${fileName}`, "success");
      } else if (result.error === "User cancelled") {
        showToast(t("tools.save_cancelled") ?? "Save cancelled", "info");
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      showToast(t("tools.report_error") ?? "Failed to generate report", "error");
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent-secondary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("tools.monthly_report")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Month */}
          <div>
            <label
              htmlFor="export-bulan"
              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {t("tools.month")}
            </label>
            <select
              id="export-bulan"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors focus:border-primary"
            >
              {t("tools.months_array").split(",").map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label
              htmlFor="export-tahun"
              className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {t("tools.year")}
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
            {t("tools.X_transactions_found", { count: transactions.length })}
          </p>
        )}

        {/* Empty state */}
        {transactions.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
              <FileDown className="h-5 w-5 text-text-muted" />
            </div>
            <p className="mt-3 text-sm text-text-muted">
              {t("tools.no_transactions_period")}
            </p>
          </div>
        )}

        {/* Buttons */}
        {transactions.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={handleDownloadCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-alt px-5 py-3 font-mono text-sm font-bold text-text-primary transition-all duration-200 hover:bg-border hover:cursor-pointer"
            >
              <Download className="h-4 w-4 text-text-muted" />
              {t("tools.export_csv")}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-mono text-sm font-bold text-on-primary transition-all duration-200 hover:bg-primary-hover hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPdfLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("tools.generating") ?? "Generating..."}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {t("tools.report_title")}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}