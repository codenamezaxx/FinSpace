"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Transaction } from "@/lib/db";

export function useTransactions(options?: { startTime?: number; endTime?: number }) {
  const transactions = useLiveQuery(() => {
    // Use indexed range query when time bounds provided — avoids loading all rows
    if (options?.startTime !== undefined || options?.endTime !== undefined) {
      const start = options?.startTime ?? 0;
      const end = options?.endTime ?? Date.now();
      return db.transactions
        .where("timestamp")
        .between(start, end, true, true)
        .reverse()
        .toArray();
    }
    return db.transactions.orderBy("timestamp").reverse().toArray();
  }, [options?.startTime, options?.endTime]);

  const addTransaction = async (
    data: Omit<Transaction, "id" | "timestamp" | "sync_status">
  ) => {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    await db.transactions.add({
      ...data,
      id,
      timestamp,
      sync_status: "local_only",
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
