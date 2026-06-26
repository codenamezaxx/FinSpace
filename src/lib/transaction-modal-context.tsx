"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type TabType = "income" | "expense";

interface TransactionModalContextValue {
  openAddTransaction: (initialTab?: TabType) => void;
  isOpen: boolean;
  initialTab: TabType;
  closeAddTransaction: () => void;
}

const TransactionModalContext =
  createContext<TransactionModalContextValue | null>(null);

export function TransactionModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<TabType>("expense");

  const openAddTransaction = useCallback((tab?: TabType) => {
    setInitialTab(tab ?? "expense");
    setIsOpen(true);
  }, []);

  const closeAddTransaction = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <TransactionModalContext.Provider
      value={{ openAddTransaction, isOpen, initialTab, closeAddTransaction }}
    >
      {children}
    </TransactionModalContext.Provider>
  );
}

export function useTransactionModal(): TransactionModalContextValue {
  const ctx = useContext(TransactionModalContext);
  if (!ctx)
    throw new Error(
      "useTransactionModal must be used within TransactionModalProvider"
    );
  return ctx;
}
