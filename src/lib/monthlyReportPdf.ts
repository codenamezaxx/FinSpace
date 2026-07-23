import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { Transaction } from "@/lib/db";

/* ─── Helpers ─── */

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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
  year: number
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const MARGIN = 20;
  const CONTENT_W = PAGE_W - MARGIN * 2; // 170mm

  const incomeAgg = aggregate(transactions, "income");
  const expenseAgg = aggregate(transactions, "expense");
  const net = incomeAgg.total - expenseAgg.total;
  const monthName = INDONESIAN_MONTHS[month - 1];
  const now = new Date();
  const nowStr = now.toLocaleDateString("id-ID", {
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
  doc.text("LAPORAN KEUANGAN BULANAN", PAGE_W / 2, y + 12, {
    align: "center",
  });
  y += 18;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(`Periode: ${monthName} ${year}`, PAGE_W / 2, y, { align: "center" });
  y += 7;
  doc.text(`Dibuat: ${nowStr}`, PAGE_W / 2, y, { align: "center" });
  y += 14;

  /* ═══════════════════════════════════════════════════════════════
     2. RINGKASAN KEUANGAN
     ═══════════════════════════════════════════════════════════════ */

  sectionTitle("Ringkasan Keuangan");

  const grandTotal = incomeAgg.total + expenseAgg.total;
  const incomePct = grandTotal > 0 ? ((incomeAgg.total / grandTotal) * 100).toFixed(1) : "0";
  const expensePct = grandTotal > 0 ? ((expenseAgg.total / grandTotal) * 100).toFixed(1) : "0";

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    theme: "grid",
    head: [["", "Jumlah", "Proporsi"]],
    body: [
      ["Pemasukan", fmtRp(incomeAgg.total), incomePct + "%"],
      ["Pengeluaran", fmtRp(expenseAgg.total), expensePct + "%"],
      ["Saldo Bersih", fmtRp(net), net >= 0 ? "Surplus" : "Defisit"],
      ["Jumlah Transaksi", `${transactions.length} transaksi`, ""],
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
    sectionTitle("Rincian Pemasukan per Kategori");

    const sortedIncome = Object.entries(incomeAgg.byCategory).sort(
      (a, b) => b[1] - a[1]
    );
    const incomeRows = sortedIncome.map(([cat, amt]) => [
      cat,
      fmtRp(amt),
      ((amt / incomeAgg.total) * 100).toFixed(1) + "%",
    ]);
    incomeRows.push(["TOTAL PEMASUKAN", fmtRp(incomeAgg.total), "100%"]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [["Kategori", "Jumlah", "Persentase"]],
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
    sectionTitle("Rincian Pengeluaran per Kategori");

    const sortedExpense = Object.entries(expenseAgg.byCategory).sort(
      (a, b) => b[1] - a[1]
    );
    const expenseRows = sortedExpense.map(([cat, amt]) => [
      cat,
      fmtRp(amt),
      ((amt / expenseAgg.total) * 100).toFixed(1) + "%",
    ]);
    expenseRows.push(["TOTAL PENGELUARAN", fmtRp(expenseAgg.total), "100%"]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [["Kategori", "Jumlah", "Persentase"]],
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
    sectionTitle("5 Pengeluaran Terbesar");

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
      head: [["No", "Merchant", "Tanggal", "Kategori", "Jumlah"]],
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
    sectionTitle("Rincian Transaksi");

    const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
    const detailRows = sorted.map((t) => [
      fmtDate(t.timestamp),
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      t.category,
      t.merchant,
      fmtRp(t.amount),
      t.payment_method,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: CONTENT_W,
      theme: "grid",
      head: [["Tanggal", "Tipe", "Kategori", "Merchant", "Jumlah", "Pembayaran"]],
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
          if (data.cell.text[0] === "Pemasukan") {
            data.cell.styles.textColor = successColor;
          } else {
            data.cell.styles.textColor = dangerColor;
          }
        }
        if (data.section === "body" && data.column.index === 4) {
          // Find original transaction to color amount
          const rowIdx = data.row.index;
          const t = sorted[rowIdx];
          if (t) {
            data.cell.styles.textColor = t.type === "income" ? successColor : dangerColor;
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
    `— Akhir Laporan — ${monthName} ${year} —`,
    PAGE_W / 2,
    y,
    { align: "center" }
  );
  y += 4;
  doc.text("Dihasilkan oleh FinSpace", PAGE_W / 2, y, { align: "center" });

  /* ─── Save ─── */

  doc.save(`FinSpace_Laporan_${monthName}_${year}.pdf`);
}
