import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { Transaction } from "@/lib/db";
import type { Pocket } from "@/lib/pocket";
import { isTransferTransaction } from "@/lib/budgetRules";
import { APP_VERSION } from "@/lib/version";
import {
  C,
  CONTENT_W,
  GEO,
  drawBanner,
  drawBannerText,
  drawCard,
  drawDonut,
  drawPageLabel,
  drawSparkline,
  drawSwatch,
  sectionHeading,
} from "@/lib/pdfReportLayout";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

const WORDMARK = "FinSpace";
const SECTION_GAP = 6;
const CARD_H = 44;
const CARD_GAP = 6;
/** Space needed to avoid orphaning a section heading: heading + head row + ~1 body row. */
const SECTION_MIN = 22;

/* ─── Formatters ─── */

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

interface PocketAgg {
  id: string;
  name: string;
  income: number;
  expense: number;
  balance: number;
}

function aggregate(transactions: Transaction[], type: "income" | "expense"): Agg {
  const items = transactions.filter((tx) => tx.type === type);
  const total = items.reduce((s, tx) => s + tx.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const tx of items) {
    byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount;
  }
  return { total, byCategory };
}

function aggregateByPocket(
  transactions: Transaction[],
  pockets: Pocket[]
): PocketAgg[] {
  const map = new Map<string, PocketAgg>();
  for (const pocket of pockets) {
    map.set(pocket.id, { id: pocket.id, name: pocket.name, income: 0, expense: 0, balance: 0 });
  }
  // Unassigned transactions go to "Tunai" pocket if exists, otherwise create "Tanpa Kantong"
  let unassignedKey = "unassigned";
  const tunaiPocket = pockets.find((p) => p.name === "Tunai");
  if (tunaiPocket) unassignedKey = tunaiPocket.id;

  for (const tx of transactions) {
    const pocketId = tx.pocketId && map.has(tx.pocketId) ? tx.pocketId : unassignedKey;
    const agg = map.get(pocketId);
    if (!agg) continue;
    if (tx.type === "income") {
      agg.income += tx.amount;
    } else {
      agg.expense += tx.amount;
    }
    agg.balance = agg.income - agg.expense;
  }
  // Filter out pockets with no activity
  return Array.from(map.values()).filter((p) => p.income > 0 || p.expense > 0);
}

/* ─── Pure data prep (exported for tests) ─── */

export interface MonthlyReportData {
  /** Filtered (no transfers), sorted newest-first. */
  transactions: Transaction[];
  incomeAgg: Agg;
  expenseAgg: Agg;
  net: number;
  topExpenses: Transaction[];
  /** Expense total per day-of-month (index 0 = day 1). */
  dailyExpense: number[];
  monthName: string;
  periodStart: string;
  periodEnd: string;
  createdStr: string;
  pocketAggs: PocketAgg[];
}

export function prepareReportData(
  transactions: Transaction[],
  month: number,
  year: number,
  t: TranslateFn,
  pockets: Pocket[]
): MonthlyReportData {
  // Pocket transfers are pure relocations — excluded from all totals,
  // category breakdowns, top-5 lists and the detail table below.
  const filtered = transactions.filter((tx) => !isTransferTransaction(tx));
  const incomeAgg = aggregate(filtered, "income");
  const expenseAgg = aggregate(filtered, "expense");
  const net = incomeAgg.total - expenseAgg.total;
  const topExpenses = [...filtered]
    .filter((tx) => tx.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const monthName = t("tools.months_array").split(",")[month - 1];
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyExpense = new Array<number>(daysInMonth).fill(0);
  for (const tx of filtered) {
    if (tx.type !== "expense") continue;
    const day = new Date(tx.timestamp).getDate();
    if (day >= 1 && day <= daysInMonth) dailyExpense[day - 1] += tx.amount;
  }

  const periodStart = `1 ${monthName} ${year}`;
  const periodEnd = `${daysInMonth} ${monthName} ${year}`;
  const createdStr = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

  const pocketAggs = aggregateByPocket(filtered, pockets);

  return {
    transactions: sorted,
    incomeAgg,
    expenseAgg,
    net,
    topExpenses,
    dailyExpense,
    monthName,
    periodStart,
    periodEnd,
    createdStr,
    pocketAggs,
  };
}

/* ─── Build (exported for tests; returns the doc without saving) ─── */

export function buildMonthlyReportPdf(
  transactions: Transaction[],
  month: number,
  year: number,
  t: TranslateFn,
  pockets: Pocket[]
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const d = prepareReportData(transactions, month, year, t, pockets);
  const bannerOpts = {
    title: t("pdf_report.title"),
    period: t("pdf_report.period", { month: d.monthName, year }),
    wordmark: WORDMARK,
  };

  // GEO is `as const` — annotate so y is `number`, not the literal `46`.
  let y: number = GEO.contentTop;
  const finalY = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  function startPage(): void {
    doc.addPage();
    drawBanner(doc);
    drawBannerText(doc, bannerOpts);
    y = GEO.contentTop;
  }

  function ensureSpace(needed: number): void {
    if (y + needed > GEO.contentBottom) startPage();
  }

  /** Plain theme: tinted header, zebra rows, thin bottom rules — no vertical grid. */
  function tableOpts(): UserOptions {
    return {
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: C.dark,
        lineWidth: { bottom: 0.1 },
        lineColor: C.border,
        cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 },
      },
      headStyles: {
        fillColor: C.tint,
        textColor: C.muted,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: C.tintAlt },
      margin: { left: GEO.marginX, right: GEO.marginX, top: GEO.contentTop, bottom: 18 },
      tableWidth: CONTENT_W,
      // Banner is idempotent — redrawn on every page autotable paginates onto.
      didDrawPage: () => {
        drawBanner(doc);
        drawBannerText(doc, bannerOpts);
      },
    };
  }

  /* ═══ 1. Banner + holder block ═══ */

  drawBanner(doc);
  drawBannerText(doc, bannerOpts);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text(`${d.periodStart} – ${d.periodEnd}`, GEO.marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text(
    `${t("pdf_report.created", { date: d.createdStr })} · ${d.transactions.length} ${t("pdf_report.transactions_suffix")}`,
    GEO.marginX,
    y + 5
  );
  y += 14;

  /* ═══ 2. Financial summary table ═══ */

  y = sectionHeading(doc, t("pdf_report.summary"), y);
  const grandTotal = d.incomeAgg.total + d.expenseAgg.total;
  const incomePct = grandTotal > 0 ? ((d.incomeAgg.total / grandTotal) * 100).toFixed(1) : "0";
  const expensePct = grandTotal > 0 ? ((d.expenseAgg.total / grandTotal) * 100).toFixed(1) : "0";

  autoTable(doc, {
    ...tableOpts(),
    startY: y,
    head: [["", t("pdf_report.amount"), t("pdf_report.percentage")]],
    body: [
      [t("pdf_report.income"), fmtRp(d.incomeAgg.total), `${incomePct}%`],
      [t("pdf_report.expenses"), fmtRp(d.expenseAgg.total), `${expensePct}%`],
      [t("pdf_report.net_balance"), fmtRp(d.net), d.net >= 0 ? t("pdf_report.surplus") : t("pdf_report.deficit")],
      [t("pdf_report.total_transactions"), String(d.transactions.length), ""],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { halign: "right", cellWidth: 57 },
      2: { halign: "right", cellWidth: 47, textColor: C.muted },
    },
    didParseCell(data) {
      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.textColor = d.net >= 0 ? C.green : C.red;
        data.cell.styles.fontStyle = "bold";
      }
    },
  } satisfies UserOptions);
  y = finalY() + SECTION_GAP + 3;

  /* ═══ 3. Highlight cards: donut + net-balance sparkline ═══ */

  ensureSpace(CARD_H + 12);
  const cardW = (CONTENT_W - CARD_GAP) / 2;
  const cardX = GEO.marginX;

  drawCard(doc, cardX, y, cardW, CARD_H);
  drawDonut(doc, cardX + 22, y + 20, 12, 7, [
    { value: d.incomeAgg.total, color: C.green },
    { value: d.expenseAgg.total, color: C.red },
  ]);
  const legendX = cardX + 40;
  drawSwatch(doc, legendX, y + 13, C.green);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.text(t("pdf_report.income"), legendX + 4.5, y + 13);
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.text(`${fmtRp(d.incomeAgg.total)} · ${incomePct}%`, legendX + 4.5, y + 18);
  drawSwatch(doc, legendX, y + 27, C.red);
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.text(t("pdf_report.expenses"), legendX + 4.5, y + 27);
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.text(`${fmtRp(d.expenseAgg.total)} · ${expensePct}%`, legendX + 4.5, y + 32);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(cardX + 6, y + 38, cardX + cardW - 6, y + 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text(fmtRp(grandTotal), cardX + cardW - 6, y + 44, { align: "right" });

  const cardX2 = cardX + cardW + CARD_GAP;
  drawCard(doc, cardX2, y, cardW, CARD_H);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text(t("pdf_report.net_balance"), cardX2 + 6, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...(d.net >= 0 ? C.green : C.red));
  doc.text(fmtRp(d.net), cardX2 + 6, y + 20);
  drawSparkline(doc, cardX2 + 6, y + 26, cardW - 12, 12, d.dailyExpense, C.blue);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(t("pdf_report.daily_expense"), cardX2 + 6, y + 44);
  y += CARD_H + SECTION_GAP + 3;

  /* ═══ 4. Income by category ═══ */

  if (d.incomeAgg.total > 0) {
    ensureSpace(SECTION_MIN);
    y = sectionHeading(doc, t("pdf_report.income_by_category"), y);
    const rows = Object.entries(d.incomeAgg.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => [cat, fmtRp(amt), `${((amt / d.incomeAgg.total) * 100).toFixed(1)}%`]);
    rows.push([t("pdf_report.total_income"), fmtRp(d.incomeAgg.total), "100%"]);
    autoTable(doc, {
      ...tableOpts(),
      startY: y,
      head: [[t("pdf_report.category"), t("pdf_report.amount"), t("pdf_report.percentage")]],
      body: rows,
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 90 },
        1: { halign: "right", cellWidth: 47 },
        2: { halign: "right", cellWidth: 37 },
      },
      didParseCell(data) {
        if (data.section === "body" && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = C.blue;
        }
      },
    } satisfies UserOptions);
    y = finalY() + SECTION_GAP;
  }

  /* ═══ 5. Expense by category ═══ */

  if (d.expenseAgg.total > 0) {
    ensureSpace(SECTION_MIN);
    y = sectionHeading(doc, t("pdf_report.expense_by_category"), y);
    const rows = Object.entries(d.expenseAgg.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => [cat, fmtRp(amt), `${((amt / d.expenseAgg.total) * 100).toFixed(1)}%`]);
    rows.push([t("pdf_report.total_expenses"), fmtRp(d.expenseAgg.total), "100%"]);
    autoTable(doc, {
      ...tableOpts(),
      startY: y,
      head: [[t("pdf_report.category"), t("pdf_report.amount"), t("pdf_report.percentage")]],
      body: rows,
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 90 },
        1: { halign: "right", cellWidth: 47 },
        2: { halign: "right", cellWidth: 37 },
      },
      didParseCell(data) {
        if (data.section === "body" && data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = C.blue;
        }
      },
    } satisfies UserOptions);
    y = finalY() + SECTION_GAP;
  }

  /* ═══ 6. Kantong (Pockets) ═══ */

  if (d.pocketAggs.length > 0) {
    ensureSpace(SECTION_MIN);
    y = sectionHeading(doc, t("pdf_report.pockets"), y);
    const pocketRows = d.pocketAggs
      .sort((a, b) => b.balance - a.balance)
      .map((p) => [
        p.name,
        fmtRp(p.income),
        fmtRp(p.expense),
        fmtRp(p.balance),
        p.balance >= 0 ? t("pdf_report.surplus") : t("pdf_report.deficit"),
      ]);
    autoTable(doc, {
      ...tableOpts(),
      startY: y,
      head: [[t("pdf_report.pocket_name"), t("pdf_report.income"), t("pdf_report.expenses"), t("pdf_report.net_balance"), t("pdf_report.status")]],
      body: pocketRows,
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { halign: "right", cellWidth: 35 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 },
        4: { halign: "center", cellWidth: 19 },
      },
      didParseCell(data) {
        if (data.section === "body") {
          const row = data.row.index;
          if (data.column.index === 3) {
            const bal = d.pocketAggs[row].balance;
            data.cell.styles.textColor = bal < 0 ? C.red : C.green;
            data.cell.styles.fontStyle = "bold";
          }
          if (data.column.index === 4) {
            data.cell.styles.textColor = d.pocketAggs[row].balance < 0 ? C.red : C.green;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    } satisfies UserOptions);
    y = finalY() + SECTION_GAP;
  }

  /* ═══ 7. Top 5 expenses ═══ */

  if (d.topExpenses.length > 0) {
    ensureSpace(SECTION_MIN);
    y = sectionHeading(doc, t("pdf_report.top_5_expenses"), y);
    autoTable(doc, {
      ...tableOpts(),
      startY: y,
      head: [[t("pdf_report.no"), t("pdf_report.merchant"), t("pdf_report.date"), t("pdf_report.category"), t("pdf_report.amount")]],
      body: d.topExpenses.map((tx, i) => [String(i + 1), tx.merchant, fmtDate(tx.timestamp), tx.category, fmtRp(tx.amount)]),
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { fontStyle: "bold", cellWidth: 55 },
        2: { halign: "center", cellWidth: 35 },
        3: { cellWidth: 37 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 35 },
      },
    } satisfies UserOptions);
    y = finalY() + SECTION_GAP;
  }

  /* ═══ 8. Transaction detail (autotable paginates; banner redrawn per page) ═══ */

  if (d.transactions.length > 0) {
    ensureSpace(SECTION_MIN);
    y = sectionHeading(doc, t("pdf_report.transaction_detail"), y);
    const sorted = d.transactions;
    const base = tableOpts();
    // Build pocket name lookup
    const pocketNames = new Map(pockets.map((p) => [p.id, p.name]));
    autoTable(doc, {
      ...base,
      startY: y,
      styles: { ...base.styles, fontSize: 7.5 },
      head: [[t("pdf_report.date"), t("pdf_report.type"), t("pdf_report.category"), t("pdf_report.merchant"), t("pdf_report.amount"), t("pdf_report.payment"), t("pdf_report.pocket")]],
      body: sorted.map((tx) => [
        fmtDate(tx.timestamp),
        tx.type === "income" ? t("pdf_report.income_type") : t("pdf_report.expense_type"),
        tx.category,
        tx.merchant,
        fmtRp(tx.amount),
        tx.payment_method,
        tx.pocketId ? pocketNames.get(tx.pocketId) || "-" : "-",
      ]),
      columnStyles: {
        0: { halign: "center", cellWidth: 24 },
        1: { halign: "center", cellWidth: 20 },
        2: { cellWidth: 26 },
        3: { fontStyle: "bold", cellWidth: 36 },
        4: { halign: "right", cellWidth: 28 },
        5: { halign: "center", cellWidth: 22 },
        6: { halign: "center", cellWidth: 18 },
      },
      didParseCell(data) {
        if (data.section !== "body") return;
        const tx = sorted[data.row.index];
        if (!tx) return;
        const color = tx.type === "income" ? C.green : C.red;
        if (data.column.index === 1) data.cell.styles.textColor = color;
        if (data.column.index === 4) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = "bold";
        }
      },
    } satisfies UserOptions);
  }

  /* ═══ 9. Final pass: page labels + footers on every page ═══ */

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    drawPageLabel(doc, t("pdf_report.page_of", { current: p, total: pages }));
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(GEO.marginX, GEO.footerRuleY, GEO.pageW - GEO.marginX, GEO.footerRuleY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text(`${t("pdf_report.generated_by")} · v${APP_VERSION}`, GEO.marginX, GEO.footerRuleY + 4.5);
    doc.text(bannerOpts.period, GEO.pageW - GEO.marginX, GEO.footerRuleY + 4.5, { align: "right" });
  }

  return doc;
}

/* ─── Public entry (signature updated; caller: ExportCSV.tsx) ─── */

export function generateMonthlyReportPdf(
  transactions: Transaction[],
  month: number,
  year: number,
  t: TranslateFn,
  pockets: Pocket[]
): void {
  const monthName = t("tools.months_array").split(",")[month - 1];
  buildMonthlyReportPdf(transactions, month, year, t, pockets).save(`FinSpace_Report_${monthName}_${year}.pdf`);
}