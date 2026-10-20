"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Transaction } from "@/lib/db";

export function useTransactions(options?: { startTime?: number; endTime?: number }) {
  // IMPORTANT: Do NOT use `.where("timestamp").between(...)` here.
  // Dexie.liveQuery fails to track dependencies for range queries built on
  // `.between()` — the observable never re-fires when rows are added/changed,
  // so components silently show stale data until a full page reload.
  // We query the full set (orderBy) and filter by time client-side instead.
  // Transaction volume in a personal-finance app is modest, so this is cheap
  // and — unlike the range query — reliably reactive.
  const allTransactions = useLiveQuery(
    () => db.transactions.orderBy("timestamp").reverse().toArray(),
    []
  );

  const transactions = useMemo(() => {
    const list = allTransactions ?? [];
    if (options?.startTime === undefined && options?.endTime === undefined) return list;
    const start = options?.startTime ?? 0;
    const end = options?.endTime ?? Date.now();
    return list.filter((t) => t.timestamp >= start && t.timestamp <= end);
  }, [allTransactions, options?.startTime, options?.endTime]);

  const addTransaction = async (
    data: Omit<Transaction, "id" | "timestamp">
  ) => {
    const timestamp = Date.now();
    const id = await db.transactions.add({
      ...data,
      timestamp,
    });
    return id;
  };

  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, "id">>
  ) => {
    await db.transactions.update(id, data);
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  const getTransaction = async (id: string) => {
    return db.transactions.get(id);
  };

  return {
    transactions: transactions ?? [],
    loading: transactions === undefined,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
  };
}

export function useTransactionsByType(type: "income" | "expense") {
  const transactions = useLiveQuery(() =>
    db.transactions
      .where("type")
      .equals(type)
      .reverse()
      .sortBy("timestamp")
  );

  return {
    transactions: transactions ?? [],
    loading: transactions === undefined,
  };
}

export function useTransactionsByCategory(category: string) {
  const transactions = useLiveQuery(() =>
    db.transactions
      .where("category")
      .equals(category)
      .reverse()
      .sortBy("timestamp")
  );

  return {
    transactions: transactions ?? [],
    loading: transactions === undefined,
  };
}
