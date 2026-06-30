"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Pocket } from "@/lib/pocket";
import type { Transaction } from "@/lib/db";
import { PRESET_POCKETS, OLD_PRESET_NAMES } from "@/lib/pocket";
import { useState, useCallback, useMemo, useEffect } from "react";

// Module-level flag — survives React StrictMode double-mounts and HMR.
// Only one seeding pass per page session, regardless of how many usePockets() mounts.
let _seedInProgress = false;
let _seeded = false;

export function usePockets() {
  const pockets = useLiveQuery(
    () => db.pockets.orderBy("sortOrder").toArray() as Promise<Pocket[]>,
    []
  );

  // Auto-seed presets on first load when table is empty.
  // Also cleans up old presets that were removed from PRESET_POCKETS.
  // Uses module-level flags (not useRef) to survive StrictMode double-mounts.
  useEffect(() => {
    if (_seeded || _seedInProgress) return;
    if (pockets === undefined) return; // still loading

    _seedInProgress = true;

    if (pockets.length > 0) {
      // Cleanup old presets that are no longer in PRESET_POCKETS
      const toRemove = pockets.filter((p) => OLD_PRESET_NAMES.has(p.name));
      if (toRemove.length > 0) {
        const ids = toRemove.map((p) => p.id);
        db.transactions.where("pocketId").anyOf(ids).modify({ pocketId: null })
          .then(() => db.pockets.bulkDelete(ids))
          .then(() => { _seeded = true; _seedInProgress = false; })
          .catch(() => { _seedInProgress = false; });
      } else {
        _seeded = true;
        _seedInProgress = false;
      }
      return;
    }

    // Fresh DB — seed presets
    const now = Date.now();
    const presets = PRESET_POCKETS.map((p, i) => ({
      id: crypto.randomUUID(),
      name: p.name,
      category: p.category,
      sortOrder: i,
      createdAt: now,
    }));
    db.pockets
      .bulkAdd(presets)
      .then(() => { _seeded = true; _seedInProgress = false; })
      .catch(() => { _seedInProgress = false; });
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

  const transferBetweenPockets = useCallback(
    async (fromPocketId: string, toPocketId: string, amount: number) => {
      if (fromPocketId === toPocketId) return;
      if (amount <= 0) return;

      const pocketList = pockets ?? [];
      const fromPocket = pocketList.find((p) => p.id === fromPocketId);
      const toPocket = pocketList.find((p) => p.id === toPocketId);
      if (!fromPocket || !toPocket) return;

      const transferId = crypto.randomUUID();
      const now = Date.now();

      const expenseTx: Transaction = {
        id: crypto.randomUUID(),
        type: "expense",
        amount,
        category: "Pindah Saldo",
        merchant: `Transfer ke ${toPocket.name}`,
        payment_method: fromPocket.name,
        timestamp: now,
        sync_status: "local_only",
        transferId,
        pocketId: fromPocketId,
      };

      const incomeTx: Transaction = {
        id: crypto.randomUUID(),
        type: "income",
        amount,
        category: "Pindah Saldo",
        merchant: `Transfer dari ${fromPocket.name}`,
        payment_method: toPocket.name,
        timestamp: now + 1,
        sync_status: "local_only",
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
