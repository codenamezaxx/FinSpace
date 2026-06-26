"use client";

import { useEffect, useState } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function ClientSerwistProvider({ children }: { children: ReactNode }) {
  // Only register SW in production (not dev localhost).
  // Initial state avoids hydration mismatch.
  const [disable, setDisable] = useState(true);

  useEffect(() => {
    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    setDisable(isDev);

    // Stale SW cleanup: only unregister SW that is NOT this app's Serwist.
    if (!isDev && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          const sw = reg.active || reg.waiting || reg.installing;
          if (sw && !sw.scriptURL.includes("serwist")) {
            reg.unregister();
          }
        }
      });
    }
  }, []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" reloadOnOnline={false} disable={disable}>
      {children}
    </SerwistProvider>
  );
}
