"use client";

import { useState, useEffect } from "react";
import { useLiveQuery, useObservable } from "dexie-react-hooks";
import { db } from "@/lib/db";

/**
 * Shared live wealth data (assets, liabilities, debts) with a re-query
 * kick when cloud sync settles — used by the wealth overview page and
 * both wealth subpages so all three always agree.
 */
export function useWealthData() {
  // Force re-render when cloud sync completes (fixes stale data after sync)
  const syncState = useObservable(db.cloud.syncState);
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    if (syncState?.phase === "pushing" || syncState?.phase === "pulling") return;
    setSyncTick((n) => n + 1);
  }, [syncState?.phase]);

  const assets = useLiveQuery(() => db.assets.toArray(), [syncTick]) ?? [];
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [syncTick]) ?? [];
  const debts = useLiveQuery(() => db.debts.toArray(), [syncTick]) ?? [];

  return { assets, liabilities, debts };
}
