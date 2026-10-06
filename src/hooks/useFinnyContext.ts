"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { usePockets } from "./usePockets";
import { useTransactions } from "./useTransactions";
import { calculateNetWorth } from "@/lib/netWorth";
import {
  buildFinnySnapshotText,
  toSnapshotTx,
} from "@/lib/ai/contextSnapshot";

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

    return buildFinnySnapshotText({
      monthLabel,
      income,
      expenses,
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
