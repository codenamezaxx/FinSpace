"use client";

import { useState, useEffect } from "react";
import { syncManager, type SyncStatus } from "@/lib/syncManager";

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(syncManager.status);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((s, msg) => {
      setStatus(s);
      setMessage(msg);
    });
    return unsubscribe;
  }, []);

  const syncNow = () => syncManager.syncPending();

  return { status, message, syncNow, isOnline: navigator.onLine };
}
