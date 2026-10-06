"use client";

import { useEffect, useRef } from "react";

/**
 * Best-effort incremental cloud pull whenever the app regains focus or
 * connectivity. Dexie Cloud's live channel (WebSocket) can drop from
 * sleep/wake cycles, flaky networks or restrictive networks — without this
 * fallback, a device would sit on stale data until logout/login.
 * `db.cloud.sync()` is incremental, so a no-op sync is cheap.
 */
export function useCloudAutosync(): void {
  const syncingRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    const kick = () => {
      if (disposed || syncingRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      syncingRef.current = true;
      import("@/lib/db")
        .then(({ db }) => db.cloud.sync())
        .catch(() => {
          // Offline or transient failure — the next kick retries
        })
        .finally(() => {
          syncingRef.current = false;
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") kick();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", kick);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", kick);
    };
  }, []);
}
