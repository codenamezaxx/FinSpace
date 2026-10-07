/**
 * Compact, read-only financial snapshot sent with every Finny request.
 *
 * The AI server cannot reach the user's IndexedDB (offline-first), so the
 * client ships a small text summary: balances, monthly totals, recent
 * transactions, assets, liabilities and debts. The model answers numeric
 * questions and gives advice FROM this data instead of guessing.
 * Transfers are already excluded from the totals by the callers.
 */

export interface SnapshotPocket {
  name: string;
  balance: number;
}

export interface SnapshotTx {
  type: string;
  amount: number;
  merchant: string;
  category: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface SnapshotItem {
  name: string;
  amount: number;
  extra?: string;
}

export interface SnapshotBudget {
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
  needsAlloc: number;
  wantsAlloc: number;
  savingsAlloc: number;
  needsSpent: number;
  wantsSpent: number;
  savingsDeposits: number;
}

export interface FinnySnapshot {
  monthLabel: string;
  income: number;
  expenses: number;
  pockets: SnapshotPocket[];
  pocketTotal: number;
  netWorth: number;
  assets: SnapshotItem[];
  liabilities: SnapshotItem[];
  debts: SnapshotItem[];
  recent: SnapshotTx[];
  budget: SnapshotBudget;
}

const MAX_POCKETS = 12;
const MAX_ITEMS = 15;
const MAX_RECENT = 20;

function rp(n: number): string {
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toSnapshotTx(tx: {
  type: string;
  amount: number;
  merchant: string;
  category: string;
  timestamp: number;
}): SnapshotTx {
  return {
    type: tx.type,
    amount: tx.amount,
    merchant: tx.merchant,
    category: tx.category,
    date: fmtDate(tx.timestamp),
  };
}

/** Render the snapshot as the prompt block appended to the system prompt. */
export function buildFinnySnapshotText(s: FinnySnapshot): string {
  const lines: string[] = [];
  lines.push("=== DATA KEUANGAN PENGGUNA (read-only, faktual) ===");
  lines.push(
    `Bulan: ${s.monthLabel} | Pemasukan: ${rp(s.income)} | Pengeluaran: ${rp(
      s.expenses
    )} (di luar transfer)`
  );
  const pocketStr =
    s.pockets
      .slice(0, MAX_POCKETS)
      .map((p) => `${p.name} ${rp(p.balance)}`)
      .join(", ") || "-";
  lines.push(`Kantong: ${pocketStr} | Total saldo: ${rp(s.pocketTotal)}`);
  lines.push(`Kekayaan bersih: ${rp(s.netWorth)}`);
  const items = (label: string, arr: SnapshotItem[]) => {
    if (arr.length === 0) lines.push(`${label}: -`);
    else
      lines.push(
        `${label}: ` +
          arr
            .slice(0, MAX_ITEMS)
            .map((a) => `${a.name} ${rp(a.amount)}${a.extra ? ` (${a.extra})` : ""}`)
            .join("; ")
      );
  };
  items("Aset", s.assets);
  items("Liabilitas", s.liabilities);
  items("Utang", s.debts);
  const b = s.budget;
  const rem = (alloc: number, spent: number) => Math.max(0, alloc - spent);
  lines.push(
    `BLOK BUDGET (persen custom pengguna ${b.needsPct}/${b.wantsPct}/${b.savingsPct} dari pemasukan ${rp(s.income)}):`
  );
  lines.push(
    `- Kebutuhan: alokasi ${rp(b.needsAlloc)}, terpakai ${rp(b.needsSpent)}, sisa ${rp(rem(b.needsAlloc, b.needsSpent))}`
  );
  lines.push(
    `- Keinginan: alokasi ${rp(b.wantsAlloc)}, terpakai ${rp(b.wantsSpent)}, sisa ${rp(rem(b.wantsAlloc, b.wantsSpent))}`
  );
  lines.push(
    `- Tabungan: target ${rp(b.savingsAlloc)}, terkumpul ${rp(b.savingsDeposits)}, kurang ${rp(rem(b.savingsAlloc, b.savingsDeposits))}`
  );
  if (s.recent.length === 0) {
    lines.push("Transaksi terakhir: -");
  } else {
    lines.push("Transaksi terakhir:");
    for (const t of s.recent.slice(0, MAX_RECENT)) {
      lines.push(
        `- ${t.date} | ${t.type} | ${rp(t.amount)} | ${t.merchant} | ${t.category}`
      );
    }
  }
  lines.push(
    "ATURAN PAKAI DATA: jawab semua pertanyaan angka (total, riwayat, saldo, utang) LANGSUNG dari data di atas — jangan mengarang angka. Untuk nasehat keuangan, rujuk kondisi faktual (mis. sisa budget, kantong terbesar, utang berjalan)."
  );
  return lines.join("\n");
}
