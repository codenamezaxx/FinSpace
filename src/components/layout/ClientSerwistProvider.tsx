"use client";

import { useEffect } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function ClientSerwistProvider({ children }: { children: ReactNode }) {
  // Register the SW in production builds only. Deriving this from NODE_ENV
  // keeps the server and client render identical (no hydration mismatch) and
  // avoids freezing a `true` initial state, which prevented registration.
  const disable = process.env.NODE_ENV !== "production";

  useEffect(() => {
    // Stale SW cleanup: only unregister SW that is NOT this app's Serwist.
    if (!disable && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          const sw = reg.active || reg.waiting || reg.installing;
          if (sw && !sw.scriptURL.includes("serwist")) {
            reg.unregister();
          }
        }
      });
    }
  }, [disable]);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" reloadOnOnline={false} disable={disable}>
      {children}
    </SerwistProvider>
  );
}
