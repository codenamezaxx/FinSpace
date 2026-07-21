"use client";

import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { NavigationBar } from "./NavigationBar";
import { TopBar } from "./TopBar";
import { FinnyTrigger, FinnySheet } from "@/components/ai";
import ScanResultModal from "@/components/ai/ScanResultModal";
import { useFinnyScan } from "@/hooks/useFinnyScan";
import { usePockets } from "@/hooks/usePockets";
import { TransactionModalProvider } from "@/lib/transaction-modal-context";
import { GlobalTransactionModal } from "@/components/shared/GlobalTransactionModal";

export function AppShell({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanImageDataUrl, setScanImageDataUrl] = useState<string | null>(null);

  const { scanImage, result, isLoading, error, reset } = useFinnyScan();
  const { pockets: pocketEnts } = usePockets();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Batasi ukuran gambar — maks 5 MB
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Maksimal 5 MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;
        setScanImageDataUrl(dataUrl);
        setIsScanOpen(true);
        reset();
        scanImage(dataUrl);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [reset, scanImage]
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
            await db.transactions.add({
              id: `trn_${Date.now()}`,
              type: data.type as "income" | "expense",
              amount: data.amount as number,
              category: data.category as string,
              merchant: data.merchant as string,
              payment_method: data.payment_method as string,
              pocketId: pocket?.id ?? null,
              timestamp: Date.now(),
            });
            break;
          }
          case "asset": {
            const assets = JSON.parse(localStorage.getItem("finspace_assets") ?? "[]");
            assets.push({ id: `asset_${Date.now()}`, name: data.name as string, amount: data.amount as number, type: data.asset_type as string, createdAt: Date.now() });
            localStorage.setItem("finspace_assets", JSON.stringify(assets));
            break;
          }
          case "liability": {
            const liabilities = JSON.parse(localStorage.getItem("finspace_liabilities") ?? "[]");
            liabilities.push({ id: `liab_${Date.now()}`, name: data.name as string, amount: data.amount as number, createdAt: Date.now() });
            localStorage.setItem("finspace_liabilities", JSON.stringify(liabilities));
            break;
          }
          case "debt": {
            const debts = JSON.parse(localStorage.getItem("finspace_debts") ?? "[]");
            debts.push({ id: `debt_${Date.now()}`, name: data.name as string, totalAmount: data.totalAmount as number, paidAmount: (data.paidAmount as number) ?? 0, dueDate: data.dueDate ? new Date(data.dueDate as string).getTime() : Date.now() + 365 * 86400000, interestRate: (data.interestRate as number) ?? undefined, createdAt: Date.now() });
            localStorage.setItem("finspace_debts", JSON.stringify(debts));
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
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} aria-hidden="true" />
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
      <ScanResultModal
        isOpen={isScanOpen}
        imageDataUrl={scanImageDataUrl}
        result={result}
        isLoading={isLoading}
        error={error}
        onSave={handleSave}
        onClose={handleModalClose}
        onRetry={handleRetry}
      />
    </div>
    </TransactionModalProvider>
  );
}
