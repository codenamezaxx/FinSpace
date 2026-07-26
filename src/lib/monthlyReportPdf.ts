import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { Transaction } from "@/lib/db";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

/* ─── Helpers ─── */

function fmtRp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── Aggregates ─── */

interface Agg {
  total: number;
  byCategory: Record<string, number>;
}

function aggregate(transactions: Transaction[], type: "income" | "expense"): Agg {
  const items = transactions.filter((t) => t.type === type);
  const total = items.reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of items) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  return { total, byCategory };
}

/* ─── Generate ─── */

export function generateMonthlyReportPdf(
  transactions: Transaction[],
  month: number,
  year: number,
  t: TranslateFn
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const MARGIN = 20;
  const CONTENT_W = PAGE_W - MARGIN * 2; // 170mm

  const incomeAgg = aggregate(transactions, "income");
  const expenseAgg = aggregate(transactions, "expense");
  const net = incomeAgg.total - expenseAgg.total;
  const monthsArr = t("tools.months_array").split(",");
  const monthName = monthsArr[month - 1];
  const now = new Date();
  const nowStr = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const primaryColor: [number, number, number] = [41, 98, 255]; // #3B82F6
  const grayColor: [number, number, number] = [100, 116, 139];
  const dangerColor: [number, number, number] = [239, 68, 68];
  const successColor: [number, number, number] = [34, 197, 94];

  let y = MARGIN;

  /* ─── Helper: section title ─── */
  function sectionTitle(text: string) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 3;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 7;
  }

  /* ═══════════════════════════════════════════════════════════════
     1. HEADER
     ═══════════════════════════════════════════════════════════════ */

  // Accent bar across top
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, PAGE_W, 4, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(t("pdf_report.title"), PAGE_W / 2, y + 12, {
    align: "center",
  });
  y += 18;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(t("pdf_report.period", { month: monthName, year }), PAGE_W / 2, y, { align: "center" });
  y += 7;
  doc.text(t("pdf_report.created", { date: nowStr }), PAGE_W / 2, y, { align: "center" });
  y += 14;

  /* ═══════════════════════════════════════════════════════════════
     2. RINGKASAN KEUANGAN
     ═══════════════════════════════════════════════════════════════ */

  sectionTitle(t("pdf_report.summary"));

  const grandTotal = incomeAgg.total + expenseAgg.total;
  const incomePct = grandTotal > 0 ? ((incomeAgg.total / grandTotal) * 100).toFixed(1) : "0";
  const expensePct = grandTotal > 0 ? ((expenseAgg.total / grandTotal) * 100).toFixed(1) : "0";

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    theme: "grid",
    head: [["", t("pdf_report.amount"), t("pdf_report.percentage")]],
    body: [
      [t("pdf_report.income"), fmtRp(incomeAgg.total), incomePct + "%"],
      [t("pdf_report.expenses"), fmtRp(expenseAgg.total), expensePct + "%"],
      [t("pdf_report.net_balance"), fmtRp(net), net >= 0 ? t("pdf_report.surplus") : t("pdf_report.deficit")],
      [t("pdf_report.total_transactions"), `${transactions.length} ${t("pdf_report.transactions_suffix")}`, ""],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { halign: "right", cellWidth: 60 },
      2: { halign: "right", cellWidth: 50 },
    },
    didParseCell(data) {
      if (data.section === "body") {
        if (data.row.index === 2) {
          // Saldo Bersih row
          if (net >= 0) {
            data.cell.styles.textColor = successColor;
          } else {
            data.cell.styles.textColor = dangerColor;
          }
        }
      }
    },
  } satisfies UserOptions);

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  /* ═══════════════════════════════════════════════════════════════
     3. PEMASUKAN PER KATEGORI
     ═══════════════════════════════════════════════════════════════ */

  if (incomeAgg.total > 0) {
    sectionTitle(t("pdf_report.income_by_category"));

    const sortedIncome = Object.entries(incomeAgg.byCategory).sort(
      (a, b) => b[1] - a[1]
    );
    const incomeRows = sortedIncome.map(([cat, amt]) => [
      cat,
      fmtRp(amt),
      ((amt / incomeAgg.total) * 100).toFixed(1) + "%",
    ]);
    incomeRows.push([t("pdf_report.total_income"), fmtRp(incomeAgg.total), "100%"]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [[t("pdf_report.category"), t("pdf_report.amount"), t("pdf_report.percentage")]],
      body: incomeRows,
      headStyles: {
        fillColor: successColor,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { halign: "right", cellWidth: 50 },
        2: { halign: "right", cellWidth: 40 },
      },
      footStyles: { fontStyle: "bold", fillColor: [240, 253, 244] },
    } satisfies UserOptions);

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  /* ═══════════════════════════════════════════════════════════════
     4. PENGELUARAN PER KATEGORI
     ═══════════════════════════════════════════════════════════════ */

  if (expenseAgg.total > 0) {
    sectionTitle(t("pdf_report.expense_by_category"));

    const sortedExpense = Object.entries(expenseAgg.byCategory).sort(
      (a, b) => b[1] - a[1]
    );
    const expenseRows = sortedExpense.map(([cat, amt]) => [
      cat,
      fmtRp(amt),
      ((amt / expenseAgg.total) * 100).toFixed(1) + "%",
    ]);
    expenseRows.push([t("pdf_report.total_expenses"), fmtRp(expenseAgg.total), "100%"]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [[t("pdf_report.category"), t("pdf_report.amount"), t("pdf_report.percentage")]],
      body: expenseRows,
      headStyles: {
        fillColor: dangerColor,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { halign: "right", cellWidth: 50 },
        2: { halign: "right", cellWidth: 40 },
      },
      footStyles: { fontStyle: "bold", fillColor: [254, 242, 242] },
    } satisfies UserOptions);

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  /* ═══════════════════════════════════════════════════════════════
     5. 5 PENGELUARAN TERBESAR
     ═══════════════════════════════════════════════════════════════ */

  const topExpenses = [...transactions]
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (topExpenses.length > 0) {
    sectionTitle(t("pdf_report.top_5_expenses"));

    const topRows = topExpenses.map((t, i) => [
      String(i + 1),
      t.merchant,
      fmtDate(t.timestamp),
      t.category,
      fmtRp(t.amount),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [[t("pdf_report.no"), t("pdf_report.merchant"), t("pdf_report.date"), t("pdf_report.category"), t("pdf_report.amount")]],
      body: topRows,
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { fontStyle: "bold", cellWidth: 55 },
        2: { halign: "center", cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 33 },
      },
    } satisfies UserOptions);

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  /* ═══════════════════════════════════════════════════════════════
     6. RINCIAN TRANSAKSI
     ═══════════════════════════════════════════════════════════════ */

  if (transactions.length > 0) {
    sectionTitle(t("pdf_report.transaction_detail"));

    const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
    const detailRows = sorted.map((tx) => [
      fmtDate(tx.timestamp),
      tx.type === "income" ? t("pdf_report.income_type") : t("pdf_report.expense_type"),
      tx.category,
      tx.merchant,
      fmtRp(tx.amount),
      tx.payment_method,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [[t("pdf_report.date"), t("pdf_report.type"), t("pdf_report.category"), t("pdf_report.merchant"), t("pdf_report.amount"), t("pdf_report.payment")]],
      body: detailRows,
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: "center", cellWidth: 28 },
        1: { halign: "center", cellWidth: 24 },
        2: { cellWidth: 28 },
        3: { fontStyle: "bold", cellWidth: 40 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 28 },
        5: { halign: "center", cellWidth: 22 },
      },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 1) {
          if (data.cell.text[0] === t("pdf_report.income_type")) {
            data.cell.styles.textColor = successColor;
          } else {
            data.cell.styles.textColor = dangerColor;
          }
        }
        if (data.section === "body" && data.column.index === 4) {
          // Find original transaction to color amount
          const rowIdx = data.row.index;
          const tx = sorted[rowIdx];
          if (tx) {
            data.cell.styles.textColor = tx.type === "income" ? successColor : dangerColor;
          }
        }
      },
    } satisfies UserOptions);

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  /* ─── Footer ─── */

  y = Math.max(y + 15, 270);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(
    t("pdf_report.report_footer", { month: monthName, year }),
    PAGE_W / 2,
    y,
    { align: "center" }
  );
  y += 4;
  doc.text(t("pdf_report.generated_by"), PAGE_W / 2, y, { align: "center" });

  /* ─── Save ─── */

  doc.save(`FinSpace_Report_${monthName}_${year}.pdf`);
}
