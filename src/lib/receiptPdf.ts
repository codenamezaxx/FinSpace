import { jsPDF } from "jspdf";
import type { Transaction } from "@/lib/db";

const MM_WIDTH = 58;
const MARGIN_X = 4; // mm from each edge
const USABLE_WIDTH = MM_WIDTH - MARGIN_X * 2; // ~50mm

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function drawDashedLine(doc: jsPDF, y: number): void {
  doc.setLineDashPattern([1, 1], 0);
  doc.line(MARGIN_X, y, MM_WIDTH - MARGIN_X, y);
  doc.setLineDashPattern([], 0);
}

export function generateReceiptPdf(transaction: Transaction): void {
  // Pre-calculate total height so we can create the page at the correct size.
  // jsPDF positions text relative to page height at render time; trimming
  // after the fact clips the MediaBox but leaves content in the original coords.
  const TOTAL_HEIGHT = 68; // mm — enough for header + 6 fields + total + footer

  const doc = new jsPDF({
    unit: "mm",
    format: [MM_WIDTH, TOTAL_HEIGHT],
  });

  doc.setFont("courier", "normal");
  let y = 8;

  // ── Header ──
  doc.setFontSize(14);
  doc.setFont("courier", "bold");
  doc.text("FINSPACE", MM_WIDTH / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text("Struk Transaksi", MM_WIDTH / 2, y, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 6;

  // ── Separator ──
  drawDashedLine(doc, y);
  y += 5;

  // ── Fields ──
  const fields: [string, string][] = [
    ["Merchant", transaction.merchant],
    ["Tanggal", formatDate(transaction.timestamp)],
    ["Jam", formatTime(transaction.timestamp)],
    ["Kategori", transaction.category],
    ["Metode", transaction.payment_method],
    ["ID", transaction.id.slice(0, 12)],
  ];

  doc.setFontSize(9);
  for (const [label, value] of fields) {
    doc.setFont("courier", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(label + ":", MARGIN_X, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("courier", "bold");
    doc.text(value, MM_WIDTH - MARGIN_X, y, { align: "right" });
    y += 5;
  }

  // ── Separator ──
  y += 1;
  drawDashedLine(doc, y);
  y += 6;

  // ── Total ──
  doc.setFontSize(11);
  doc.setFont("courier", "bold");
  doc.text("Total:", MARGIN_X, y);
  doc.text(formatRp(transaction.amount), MM_WIDTH - MARGIN_X, y, { align: "right" });
  y += 6;

  // ── Separator ──
  drawDashedLine(doc, y);
  y += 6;

  // ── Footer ──
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text("Terima kasih!", MM_WIDTH / 2, y, { align: "center" });
  y += 4;
  doc.text("FinSpace App v1.0", MM_WIDTH / 2, y, { align: "center" });
  y += 6;

  // ── Save ──
  const safeMerchant = transaction.merchant.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
  const dateStr = formatDate(transaction.timestamp).replace(/\//g, "");
  doc.save(`struk-${safeMerchant}-${dateStr}.pdf`);
}
