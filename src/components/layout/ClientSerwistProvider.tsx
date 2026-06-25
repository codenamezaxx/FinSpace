"use client";

import { useEffect, useState } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function ClientSerwistProvider({ children }: { children: ReactNode }) {
  // Safety net: unregister any stale service worker from previous sessions.
  // Prevents refresh loops from old SW with skipWaiting persisting across restarts.
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) reg.unregister();
      });
    }
  }, []);

  // Disable SW in dev (localhost) to prevent refresh loops.
  // State avoids hydration mismatch — initial render always disabled.
  const [disable, setDisable] = useState(true);
  useEffect(() => {
    setDisable(
      window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    );
  }, []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" reloadOnOnline={false} disable={disable}>
      {children}
    </SerwistProvider>
  );
}
