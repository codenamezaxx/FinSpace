import { db } from "@/lib/db";
import type { Transaction } from "@/lib/db";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SEED_MERCHANTS } from "@/lib/constants";

function randomId() {
  return crypto.randomUUID();
}

function randomAmount(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSampleTransactions(): Transaction[] {
  const samples: Transaction[] = [];

  // Last 30 days of transactions
  for (let i = 0; i < 30; i++) {
    const isExpense = Math.random() > 0.3; // 70% expense
    const timestamp = Date.now() - i * 86400000 - randomAmount(0, 43200000);

    samples.push({
      id: randomId(),
      amount: isExpense
        ? randomAmount(10000, 500000)
        : randomAmount(1000000, 10000000),
      type: isExpense ? "expense" : "income",
      category: isExpense
        ? randomItem(EXPENSE_CATEGORIES)
        : randomItem(INCOME_CATEGORIES),
      merchant: randomItem(SEED_MERCHANTS),
      payment_method: randomItem(["Cash", "Transfer Bank", "Kartu Kredit", "E-Wallet"]),
      timestamp,
    });
  }

  return samples;
}

export async function seedDatabase() {
  const count = await db.transactions.count();
  if (count > 0) {
    console.log(`Database already has ${count} transactions, skipping seed.`);
    return;
  }

  const samples = generateSampleTransactions();

  await db.transactions.bulkAdd(samples);
  console.log(`Seeded ${samples.length} sample transactions.`);
}
