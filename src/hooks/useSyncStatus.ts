"use client";

import { useObservable } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMemo } from "react";

export type SyncStatusDisplay = "synced" | "syncing" | "offline";

export interface SyncStatusInfo {
  status: SyncStatusDisplay;
  phase: string;
  progress: number | null;
  lastSyncTime: Date | null;
}

export function useSyncStatus(): SyncStatusInfo {
  const syncState = useObservable(db.cloud.syncState);

  return useMemo(() => {
    if (!syncState) {
      return { status: "offline", phase: "initial", progress: null, lastSyncTime: null };
    }

    let display: SyncStatusDisplay;
    if (syncState.status === "offline" || syncState.status === "disconnected") {
      display = "offline";
    } else if (syncState.phase === "pushing" || syncState.phase === "pulling") {
      display = "syncing";
    } else {
      display = "synced";
    }

    return {
      status: display,
      phase: syncState.phase,
      progress: syncState.progress ?? null,
      lastSyncTime: null, // Dexie Cloud tidak provide lastSyncTime built-in
    };
  }, [syncState]);
}
