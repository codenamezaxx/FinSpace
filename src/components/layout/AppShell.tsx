"use client";

import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { NavigationBar } from "./NavigationBar";
import { TopBar } from "./TopBar";
import { FinnyTrigger, FinnySheet } from "@/components/ai";
import ScanResultModal from "@/components/ai/ScanResultModal";
import CameraOverlay from "@/components/shared/CameraOverlay";
import { NotificationSheet } from "@/components/notifications/NotificationSheet";
import { useNotificationsContext } from "@/components/notifications/NotificationsProvider";
import { useFinnyScan } from "@/hooks/useFinnyScan";
import { usePockets } from "@/hooks/usePockets";
import { TransactionModalProvider } from "@/lib/transaction-modal-context";
import { GlobalTransactionModal } from "@/components/shared/GlobalTransactionModal";
import { notifyTransaction, checkOverspending, checkCreditReminders } from "@/lib/notificationTriggers";
import { db, migrateWealthFromLocalStorage, deduplicateWealthData } from "@/lib/db";
import type { Transaction } from "@/lib/db";

export function AppShell({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanImageDataUrl, setScanImageDataUrl] = useState<string | null>(null);

  const { scanImage, result, isLoading, error, reset } = useFinnyScan();
  const { pockets: pocketEnts } = usePockets();
  const {
    isOpen: isNotificationsOpen,
    closeNotifications,
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationsContext();

  // Run wealth data migration from localStorage → IndexedDB once on startup, then dedup
  useEffect(() => {
    migrateWealthFromLocalStorage()
      .then(() => deduplicateWealthData())
      .then(() => db.transactions.toArray())
      .then((txns) => checkCreditReminders(txns as any[]));
  }, []);

  const handleScanClick = useCallback(() => {
    reset();
    setIsScanOpen(true);
  }, [reset]);

  const handleScanImage = useCallback(
    (dataUrl: string) => {
      setScanImageDataUrl(dataUrl);
      scanImage(dataUrl);
    },
    [scanImage]
  );

  const handleModalClose = useCallback(() => {
    setIsScanOpen(false);
    setScanImageDataUrl(null);
    reset();
  }, [reset]);

  const handleRetry = useCallback(() => {
    if (scanImageDataUrl) scanImage(scanImageDataUrl);
  }, [scanImageDataUrl, scanImage]);

  const handleSave = useCallback(
    async (action: string, data: Record<string, unknown>) => {
      try {
        switch (action) {
          case "transaction": {
            const { db } = await import("@/lib/db");
            const pocketName = (data.pocket_name as string) || "Tunai";
            const pocket = pocketEnts.find(
              (p) => p.name.toLowerCase() === pocketName.toLowerCase()
            ) ?? pocketEnts.find((p) => p.name === "Tunai");
            const id = `trn_${Date.now()}`;
            await db.transactions.add({
              id,
              type: data.type as "income" | "expense",
              amount: data.amount as number,
              category: data.category as string,
              merchant: data.merchant as string,
              payment_method: data.payment_method as string,
              pocketId: pocket?.id ?? null,
              timestamp: Date.now(),
            });

            // Create notification for the scanned transaction
            const scannedTxn: Transaction = {
              id,
              type: data.type as "income" | "expense",
              amount: data.amount as number,
              category: data.category as string,
              merchant: data.merchant as string,
              payment_method: data.payment_method as string,
              pocketId: pocket?.id ?? null,
              timestamp: Date.now(),
            };
            await notifyTransaction(scannedTxn as any);

            // Check overspending
            const allTxns = await db.transactions.toArray();
            const pocketBudgets = pocketEnts.map((p) => ({
              pocketId: p.id,
              category: p.category,
              budget: (p as any).budget ?? 0,
            }));
            await checkOverspending(allTxns as any[], pocketBudgets);

            break;
          }
          case "asset": {
            await db.assets.put({
              id: `ass${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
              name: data.name as string,
              amount: data.amount as number,
              type: data.asset_type as "liquid" | "investment" | "property" | "other",
              createdAt: Date.now(),
            });
            break;
          }
          case "liability": {
            await db.liabilities.put({
              id: `lia${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
              name: data.name as string,
              amount: data.amount as number,
              createdAt: Date.now(),
            });
            break;
          }
          case "debt": {
            await db.debts.put({
              id: `dbt${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
              name: data.name as string,
              totalAmount: data.totalAmount as number,
              paidAmount: (data.paidAmount as number) ?? 0,
              dueDate: data.dueDate ? new Date(data.dueDate as string).getTime() : Date.now() + 365 * 86400000,
              interestRate: (data.interestRate as number) ?? undefined,
              createdAt: Date.now(),
            });
            break;
          }
        }
        handleModalClose();
      } catch (err) {
        console.error("Scan save error:", err);
      }
    },
    [handleModalClose, pocketEnts]
  );

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
        onScan={handleScanClick}
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
      <div className="fixed bottom-24 right-6 z-50 lg:bottom-12 lg:right-12">
        <FinnyTrigger onClick={() => setIsChatOpen(true)} />
      </div>
      <FinnySheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onScan={handleScanClick}
      />
      <CameraOverlay
        isOpen={isScanOpen && !scanImageDataUrl}
        onCapture={handleScanImage}
        onClose={handleModalClose}
      />
      <ScanResultModal
        isOpen={isScanOpen && !!scanImageDataUrl}
        imageDataUrl={scanImageDataUrl}
        result={result}
        isLoading={isLoading}
        error={error}
        onSave={handleSave}
        onClose={handleModalClose}
        onRetry={handleRetry}
      />
      <NotificationSheet
        isOpen={isNotificationsOpen}
        onClose={closeNotifications}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
      />
    </div>
    </TransactionModalProvider>
  );
}
