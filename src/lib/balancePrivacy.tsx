"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface BalancePrivacyContextType {
  isHidden: boolean;
  toggle: () => void;
  setHidden: (hidden: boolean) => void;
}

const BalancePrivacyContext = createContext<BalancePrivacyContextType | null>(null);

export function BalancePrivacyProvider({ children }: { children: ReactNode }): ReactNode {
  const [isHidden, setIsHidden] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("balancePrivacy");
      if (stored !== null) {
        setIsHidden(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem("balancePrivacy", JSON.stringify(isHidden));
    } catch {
      // ignore quota errors
    }
  }, [isHidden]);

  const toggle = () => setIsHidden((prev) => !prev);
  const setHidden = (hidden: boolean) => setIsHidden(hidden);

  return (
    <BalancePrivacyContext.Provider value={{ isHidden, toggle, setHidden }}>
      {children}
    </BalancePrivacyContext.Provider>
  );
}

export function useBalancePrivacy(): BalancePrivacyContextType {
  const ctx = useContext(BalancePrivacyContext);
  if (!ctx) {
    throw new Error("useBalancePrivacy must be used within BalancePrivacyProvider");
  }
  return ctx;
}

/**
 * Mask a numeric value for privacy display.
 * Returns "••••" when hidden, otherwise returns the value as-is.
 */
export function maskValue(value: number, isHidden: boolean): number | string {
  return isHidden ? "••••" : value;
}

/**
 * Format currency with privacy masking.
 * When hidden, returns "Rp ••••" (or locale equivalent).
 */
export function formatCurrencyPrivacy(
  value: number,
  isHidden: boolean,
  locale = "id-ID",
  currency = "IDR"
): string {
  if (isHidden) {
    const masked = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
    return masked.replace(/[\d.,]+/g, "••••");
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}