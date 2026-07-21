"use client";

import { useLiveQuery, useObservable } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Pocket } from "@/lib/pocket";
import type { Transaction } from "@/lib/db";
import { OLD_PRESET_NAMES } from "@/lib/pocket";
import { seedPresets, hasSeeded } from "@/lib/seedPresets";
import { useState, useCallback, useMemo, useEffect } from "react";

export function usePockets() {
  const pockets = useLiveQuery(
    () => db.pockets.orderBy("sortOrder").toArray() as Promise<Pocket[]>,
    []
  );

  // ── Seed presets (idempotent, module-level lock) ──
  // Only seed after cloud sync settles to avoid creating pockets
  // during a realm transition (guest→Google DB wipe + re-sync).
  const syncState = useObservable(db.cloud.syncState);
  const isSyncing =
    syncState?.phase === "pulling" || syncState?.phase === "pushing";

  useEffect(() => {
    // Skip if already seeded, or cloud is still syncing.
    if (hasSeeded() || isSyncing) return;

    // Wait a tick for DB to be ready, then seed.
    const timeout = setTimeout(() => {
      seedPresets();
    }, 150);

    return () => clearTimeout(timeout);
    // Run when isSyncing transitions from true→false (sync complete).
    // Also runs on mount if not syncing.
  }, [isSyncing]);

  // ── Cleanup old presets (via useLiveQuery, bukan seeding) ──
  useEffect(() => {
    if (!pockets || pockets.length === 0) return;
    const toRemove = pockets.filter((p) => OLD_PRESET_NAMES.has(p.name));
    if (toRemove.length === 0) return;
    const ids = toRemove.map((p) => p.id);
    db.transactions.where("pocketId").anyOf(ids).modify({ pocketId: null })
      .then(() => db.pockets.bulkDelete(ids))
      .catch(() => {});
  }, [pockets]);

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
    const id = await db.pockets.add({ name, category, sortOrder: maxOrder, createdAt: Date.now() });
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

  const transferBetweenPockets = useCallback(
    async (fromPocketId: string, toPocketId: string, amount: number) => {
      if (fromPocketId === toPocketId) throw new Error("Kantong sumber dan tujuan harus berbeda.");
      if (amount <= 0) throw new Error("Jumlah transfer harus lebih dari 0.");

      const pocketList = pockets ?? [];
      const fromPocket = pocketList.find((p) => p.id === fromPocketId);
      const toPocket = pocketList.find((p) => p.id === toPocketId);
      if (!fromPocket || !toPocket) throw new Error("Kantong sumber atau tujuan tidak ditemukan.");

      const transferId = crypto.randomUUID();
      const now = Date.now();

      const expenseTx: Omit<Transaction, "id"> = {
        type: "expense",
        amount,
        category: "Pindah Saldo",
        merchant: `Transfer ke ${toPocket.name}`,
        payment_method: fromPocket.name,
        timestamp: now,
        transferId,
        pocketId: fromPocketId,
      };

      const incomeTx: Omit<Transaction, "id"> = {
        type: "income",
        amount,
        category: "Pindah Saldo",
        merchant: `Transfer dari ${fromPocket.name}`,
        payment_method: toPocket.name,
        timestamp: now + 1,
        transferId,
        pocketId: toPocketId,
      };

      await db.transactions.bulkAdd([expenseTx, incomeTx]);
    },
    [pockets]
  );

  return {
    pockets: pockets ?? [],
    balances,
    totalBalance,
    addPocket,
    renamePocket,
    deletePocket,
    transferBetweenPockets,
    pocketFilter,
    setPocketFilter,
    loading: pockets === undefined,
  };
}
