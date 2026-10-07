"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { usePockets } from "./usePockets";
import { useTransactions } from "./useTransactions";
import { calculateNetWorth } from "@/lib/netWorth";
import { getBudgetCategory } from "@/lib/budgetRules";
import {
  buildFinnySnapshotText,
  toSnapshotTx,
} from "@/lib/ai/contextSnapshot";

const ALLOCATION_KEY = "finspace-budget-allocation";

function readAllocation(): { needs: number; wants: number; savings: number } {
  try {
    if (typeof window === "undefined") return { needs: 50, wants: 30, savings: 20 };
    const raw = localStorage.getItem(ALLOCATION_KEY);
    if (raw) {
      const p = JSON.parse(raw) as {
        needs?: unknown;
        wants?: unknown;
        savings?: unknown;
      };
      if (
        typeof p.needs === "number" &&
        typeof p.wants === "number" &&
        typeof p.savings === "number"
      ) {
        return { needs: p.needs, wants: p.wants, savings: p.savings };
      }
    }
  } catch {
    // corrupted storage — fall through to defaults
  }
  return { needs: 50, wants: 30, savings: 20 };
}

/**
 * Builds the compact financial snapshot text shipped with every Finny
 * request (the AI server cannot read local IndexedDB). Transfers are
 * excluded from income/expense totals.
 */
export function useFinnyContext(): string {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { transactions } = useTransactions({ startTime: startOfMonth });
  const { pockets, balances, totalBalance } = usePockets();
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? [];
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), []) ?? [];
  const debts = useLiveQuery(() => db.debts.toArray(), []) ?? [];

  return useMemo(() => {
    const mine = transactions.filter((t) => !t.transferId);
    const income = mine
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expenses = mine
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const netWorth = calculateNetWorth(
      assets,
      liabilities,
      totalBalance,
      debts
    ).netWorth;

    // Budget buckets (same rules as the budget page)
    const alloc = readAllocation();
    let needsSpent = 0;
    let wantsSpent = 0;
    for (const t of mine) {
      if (t.type !== "expense") continue;
      const bucket = getBudgetCategory(t.category);
      if (bucket === "needs") needsSpent += t.amount;
      else if (bucket === "wants") wantsSpent += t.amount;
    }
    // Same rule as the savings ring: any Tabungan-category transaction counts
    const savingsDeposits = mine
      .filter((t) => t.category === "Tabungan")
      .reduce((s, t) => s + t.amount, 0);

    return buildFinnySnapshotText({
      monthLabel,
      income,
      expenses,
      budget: {
        needsPct: alloc.needs,
        wantsPct: alloc.wants,
        savingsPct: alloc.savings,
        needsAlloc: Math.round((income * alloc.needs) / 100),
        wantsAlloc: Math.round((income * alloc.wants) / 100),
        savingsAlloc: Math.round((income * alloc.savings) / 100),
        needsSpent,
        wantsSpent,
        savingsDeposits,
      },
      pockets: pockets.map((p) => ({ name: p.name, balance: balances[p.id] ?? 0 })),
      pocketTotal: totalBalance,
      netWorth,
      assets: assets.map((a) => ({ name: a.name, amount: a.amount })),
      liabilities: liabilities.map((l) => ({ name: l.name, amount: l.amount })),
      debts: debts.map((d) => ({
        name: d.name,
        amount: Math.max(0, d.totalAmount - (d.paidAmount ?? 0)),
      })),
      recent: [...mine]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)
        .map(toSnapshotTx),
    });
  }, [transactions, pockets, balances, totalBalance, assets, liabilities, debts, monthLabel]);
}
