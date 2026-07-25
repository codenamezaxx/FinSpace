import { db, type Transaction } from "@/lib/db";

type PocketBudget = {
  pocketId: string;
  category: string;
  budget: number;
};

/** Create a "transaction" type notification when a new expense is added */
export async function notifyTransaction(transaction: Transaction): Promise<void> {
  if (transaction.type !== "expense") return;
  
  const id = `ntf${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const amount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.abs(transaction.amount));
  
  await db.notifications.add({
    id,
    type: "transaction",
    title: "Pengeluaran Baru",
    message: `${amount} — ${transaction.merchant || (transaction as any).description || "Transaksi"}`,
    read: 0,
    createdAt: Date.now(),
    relatedId: transaction.id,
  });
}

/** Check if any pocket has exceeded its budget and create overspending notifications */
export async function checkOverspending(
  transactions: Transaction[],
  pocketBudgets: PocketBudget[]
): Promise<string[]> {
  const created: string[] = [];
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).getTime();
  
  const thisMonthTxns = transactions.filter(
    (t) => t.timestamp >= monthStart && t.timestamp <= monthEnd && t.type === "expense"
  );

  for (const pocket of pocketBudgets) {
    if (!pocket.budget || pocket.budget <= 0) continue;

    const spent = thisMonthTxns
      .filter((t) => t.pocketId === pocket.pocketId)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (spent > pocket.budget) {
      const id = `ntf${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const overspend = spent - pocket.budget;
      const overspendFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(overspend);
      
      await db.notifications.add({
        id,
        type: "overspending",
        title: "Anggaran Terlampaui",
        message: `${pocket.category} telah melebihi anggaran sebesar ${overspendFormatted}`,
        read: 0,
        createdAt: Date.now(),
        relatedId: pocket.pocketId,
      });
      created.push(id);
    }
  }
  return created;
}

/** Check if any credit card bill is approaching (within 7 days) */
export async function checkCreditReminders(transactions: Transaction[]): Promise<string[]> {
  const created: string[] = [];
  
  // Find the latest credit card bill transaction
  const creditTxns = transactions.filter(
    (t) => t.category === "credit_card" || t.category?.toLowerCase().includes("kartu kredit")
  );

  if (creditTxns.length === 0) return created;

  const latestCredit = creditTxns.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  const oneWeekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

  // If the due date (approximate: 25 days after latest transaction) is within 7 days
  const estimatedDueDate = latestCredit.timestamp + 25 * 24 * 60 * 60 * 1000;

  if (estimatedDueDate > Date.now() && estimatedDueDate < oneWeekFromNow) {
    const id = `ntf${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const daysLeft = Math.ceil((estimatedDueDate - Date.now()) / (24 * 60 * 60 * 1000));
    
    await db.notifications.add({
      id,
      type: "credit_reminder",
      title: "Tagihan Kartu Kredit",
      message: `Tagihan kartu kredit akan jatuh tempo dalam ${daysLeft} hari`,
      read: 0,
      createdAt: Date.now(),
      relatedId: latestCredit.id,
    });
    created.push(id);
  }

  return created;
}
