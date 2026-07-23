"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useDebounce } from "@/hooks/useDebounce";

export interface TransactionResult {
  id: string;
  type: "income" | "expense";
  merchant: string;
  category: string;
  amount: number;
  pocketId: string | null | undefined;
  timestamp: number;
}

export interface AssetResult {
  id: string;
  name: string;
  amount: number;
}

export interface LiabilityResult {
  id: string;
  name: string;
  amount: number;
}

export interface DebtResult {
  id: string;
  name: string;
  totalAmount: number;
}

export interface ToolResult {
  id: string;
  name: string;
}

export interface SearchResults {
  transactions: TransactionResult[];
  assets: AssetResult[];
  liabilities: LiabilityResult[];
  debts: DebtResult[];
  tools: ToolResult[];
}

export const SEARCHABLE_TOOLS: ToolResult[] = [
  { id: "loan-calculator", name: "Kalkulator Pinjaman" },
  { id: "savings-goal", name: "Target Tabungan" },
  { id: "export-csv", name: "Ekspor CSV" },
  { id: "receipt-generator", name: "Generator Struk" },
];

export function useSearch(rawQuery: string) {
  const query = useDebounce(rawQuery.trim(), 300);

  const allTransactions = useLiveQuery(() => db.transactions.toArray());
  const allAssets = useLiveQuery(() => db.assets.toArray(), []);
  const allLiabilities = useLiveQuery(() => db.liabilities.toArray(), []);
  const allDebts = useLiveQuery(() => db.debts.toArray(), []);

  return useMemo(() => {
    if (query.length < 2) {
      return { results: null, loading: false };
    }

    const q = query.toLowerCase();

    const txList = allTransactions ?? [];
    const matchingTransactions = txList
      .filter((tx) => {
        const merchantMatch = tx.merchant.toLowerCase().includes(q);
        const categoryMatch = tx.category.toLowerCase().includes(q);
        const amountMatch = tx.amount.toString() === q;
        return merchantMatch || categoryMatch || amountMatch;
      })
      .slice(0, 5)
      .map((tx) => ({
        id: tx.id,
        type: tx.type,
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
        pocketId: tx.pocketId,
        timestamp: tx.timestamp,
      } satisfies TransactionResult));

    const matchingAssets = (allAssets ?? [])
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 5);

    const matchingLiabilities = (allLiabilities ?? [])
      .filter((l) => l.name.toLowerCase().includes(q))
      .slice(0, 5);

    const matchingDebts = (allDebts ?? [])
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 5);

    const matchingTools = SEARCHABLE_TOOLS.filter((t) =>
      t.name.toLowerCase().includes(q)
    );

    return {
      results: {
        transactions: matchingTransactions,
        assets: matchingAssets,
        liabilities: matchingLiabilities,
        debts: matchingDebts,
        tools: matchingTools,
      } satisfies SearchResults,
      loading: allTransactions === undefined,
    };
  }, [query, allTransactions, allAssets, allLiabilities, allDebts]);
}
