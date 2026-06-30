"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Pocket } from "@/lib/pocket";
import { PRESET_POCKETS } from "@/lib/pocket";
import { useState, useCallback, useMemo } from "react";

export function usePockets() {
  const pockets = useLiveQuery(async () => {
    let result = await db.pockets.orderBy("sortOrder").toArray();
    if (result.length === 0) {
      const now = Date.now();
      const presets = PRESET_POCKETS.map((p, i) => ({
        id: crypto.randomUUID(),
        name: p.name,
        category: p.category,
        sortOrder: i,
        createdAt: now,
      }));
      await db.pockets.bulkAdd(presets);
      result = presets;
    }
    return result as Pocket[];
  }, []);

  const allTransactions = useLiveQuery(
    () => db.transactions.toArray(),
    []
  );

  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    const txs = allTransactions ?? [];
    for (const pocket of pockets ?? []) {
      const balance = txs
        .filter((t) => t.pocketId === pocket.id)
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
      map[pocket.id] = balance;
    }
    // Unassigned transactions → Tunai pocket
    const tunaiPocket = (pockets ?? []).find((p) => p.name === "Tunai");
    if (tunaiPocket) {
      const unassigned = txs
        .filter((t) => !t.pocketId)
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
      map[tunaiPocket.id] = (map[tunaiPocket.id] || 0) + unassigned;
    }
    return map;
  }, [allTransactions, pockets]);

  const totalBalance = useMemo(
    () => Object.values(balances).reduce((s, v) => s + v, 0),
    [balances]
  );

  const [pocketFilter, setPocketFilter] = useState<string | null>(null);

  const addPocket = useCallback(async (name: string, category: Pocket["category"]) => {
    const maxOrder = (pockets ?? []).length;
    const id = crypto.randomUUID();
    await db.pockets.add({ id, name, category, sortOrder: maxOrder, createdAt: Date.now() });
    return id;
  }, [pockets]);

  const renamePocket = useCallback(async (id: string, newName: string) => {
    await db.pockets.update(id, { name: newName });
  }, []);

  const deletePocket = useCallback(async (id: string) => {
    const txs = await db.transactions.where("pocketId").equals(id).toArray();
    for (const tx of txs) {
      await db.transactions.update(tx.id, { pocketId: null });
    }
    await db.pockets.delete(id);
    setPocketFilter((prev) => (prev === id ? null : prev));
  }, []);

  return {
    pockets: pockets ?? [],
    balances,
    totalBalance,
    addPocket,
    renamePocket,
    deletePocket,
    pocketFilter,
    setPocketFilter,
    loading: pockets === undefined,
  };
}
