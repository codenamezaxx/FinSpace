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

const ASSETS_KEY = "finspace_assets";
const LIABILITIES_KEY = "finspace_liabilities";
const DEBTS_KEY = "finspace_debts";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useSearch(rawQuery: string) {
  const query = useDebounce(rawQuery.trim(), 300);

  const allTransactions = useLiveQuery(() => db.transactions.toArray());

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

    const allAssets = readStorage<AssetResult[]>(ASSETS_KEY, []);
    const matchingAssets = allAssets
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 5);

    const allLiabilities = readStorage<LiabilityResult[]>(LIABILITIES_KEY, []);
    const matchingLiabilities = allLiabilities
      .filter((l) => l.name.toLowerCase().includes(q))
      .slice(0, 5);

    const allDebts = readStorage<DebtResult[]>(DEBTS_KEY, []);
    const matchingDebts = allDebts
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
  }, [query, allTransactions]);
}
