import type { Transaction } from "@/lib/db";

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

/**
 * Open a print dialog with a thermal-receipt-style layout matching the PDF design.
 * Opens a new window with the receipt HTML, triggers print, then closes after.
 */
export function printReceiptHtml(transaction: Transaction): void {
  const totalAmount = transaction.amount;
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? "#22C55E" : "#EF4444";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cetak Struk - FinSpace</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px;
      width: 58mm;
      padding: 4mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .muted { color: #666; }
    .dashed {
      border: none;
      border-top: 1px dashed #999;
      margin: 3mm 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 0.5mm 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: bold;
      padding: 0.5mm 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 8px;
      margin-top: 1mm;
    }
    @media print {
      html, body { width: 58mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center bold" style="font-size: 14px;">FINSPACE</div>
  <div class="center muted" style="font-size: 8px; margin-bottom: 2mm;">Struk Transaksi</div>

  <hr class="dashed">

  <!-- Fields -->
  <div class="row"><span class="muted">Merchant:</span><span class="bold">${escapeHtml(transaction.merchant)}</span></div>
  <div class="row"><span class="muted">Tanggal:</span><span class="bold">${formatDate(transaction.timestamp)}</span></div>
  <div class="row"><span class="muted">Jam:</span><span class="bold">${formatTime(transaction.timestamp)}</span></div>
  <div class="row"><span class="muted">Kategori:</span><span class="bold">${escapeHtml(transaction.category)}</span></div>
  <div class="row"><span class="muted">Metode:</span><span class="bold">${escapeHtml(transaction.payment_method)}</span></div>
  <div class="row"><span class="muted">ID:</span><span class="bold">${transaction.id.slice(0, 12)}</span></div>

  <hr class="dashed">

  <!-- Total -->
  <div class="total-row">
    <span>Total:</span>
    <span style="color: ${amountColor};">${formatRp(totalAmount)}</span>
  </div>

  <hr class="dashed">

  <!-- Footer -->
  <div class="footer">Terima kasih!</div>
  <div class="footer">FinSpace App v1.0</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=400,height=600,menubar=no,toolbar=no,location=no,status=no");
  if (!printWindow) {
    // Fallback: if popup blocked, try printing from current page
    alert("Izinkan pop-up untuk mencetak struk, atau gunakan Unduh PDF.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Wait for content to render, then print
  setTimeout(() => {
    printWindow.print();
    // Close after print dialog closes (user must close manually or via afterPrint)
    printWindow.onafterprint = () => printWindow.close();
    // Fallback: close after 30s if user left the window
    setTimeout(() => {
      try { printWindow.close(); } catch { /* already closed */ }
    }, 30000);
  }, 300);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
