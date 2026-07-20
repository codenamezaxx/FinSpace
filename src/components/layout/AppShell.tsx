"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { NavigationBar } from "./NavigationBar";
import { TopBar } from "./TopBar";
import { FinnyTrigger, FinnySheet } from "@/components/ai";
import { TransactionModalProvider } from "@/lib/transaction-modal-context";
import { GlobalTransactionModal } from "@/components/shared/GlobalTransactionModal";

export function AppShell({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <TransactionModalProvider>
      <GlobalTransactionModal />
      <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Subtle radial glow behind content — shows through glass cards */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "var(--glow-primary)" }} />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "var(--glow-accent)" }} />
      </div>

      <NavigationBar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <TopBar isSidebarCollapsed={isSidebarCollapsed} />
      <main
        className={`relative z-10 flex-1 pt-16 pb-20 transition-all duration-300 lg:pb-0 ${
          isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          {children}
        </div>
      </main>
      <div className="fixed bottom-24 right-6 z-50 lg:bottom-20 lg:right-8">
        <FinnyTrigger onClick={() => setIsChatOpen(true)} />
      </div>
      <FinnySheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
    </TransactionModalProvider>
  );
}
