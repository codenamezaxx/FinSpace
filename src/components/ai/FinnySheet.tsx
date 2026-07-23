"use client";

import React, { useState, useCallback, useMemo, type FC } from "react";
import { Bot, X } from "lucide-react";
import { useFinnyChat, type PocketInfo } from "@/hooks/useFinnyChat";
import { usePockets } from "@/hooks/usePockets";
import FinnyChatArea from "./FinnyChatArea";
import FinnyInput from "./FinnyInput";
import TransactionPreview from "./TransactionPreview";
import type { FinnyMessage } from "./FinnyChatArea";
import { db } from "@/lib/db";

interface FinnySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: () => void;
}

const FinnySheet: FC<FinnySheetProps> = ({ isOpen, onClose, onScan }) => {
  const { messages, isLoading, isOffline, sendMessage } = useFinnyChat();
  const { pockets: pocketEnts, addPocket } = usePockets();
  const [showPreview, setShowPreview] = useState(false);

  const pocketInfo: PocketInfo[] = useMemo(
    () =>
      pocketEnts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    [pocketEnts]
  );

  // Wrap sendMessage so pockets are always included
  const handleSend = useCallback(
    (text: string) => sendMessage(text, pocketInfo),
    [sendMessage, pocketInfo]
  );

  // Find the last AI message with transaction data
  const lastParsedMsg = [...messages]
    .reverse()
    .find(
      (m): m is FinnyMessage & { action: string; data: Record<string, unknown> } =>
        m.role === "assistant" &&
        !!m.action &&
        m.action !== "chat" &&
        m.action !== "clarify" &&
        !!m.data
    );

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
              dueDate: data.dueDate
                ? new Date(data.dueDate as string).getTime()
                : Date.now() + 365 * 86400000,
              interestRate: (data.interestRate as number) ?? undefined,
              createdAt: Date.now(),
            });
            break;
          }
          case "create_pocket": {
            const name = data.name as string;
            if (!name?.trim()) throw new Error("Nama kantong harus diisi");
            const category = (data.category as "tunai" | "ewallet" | "rekening") ?? "ewallet";
            const pocketId = await addPocket(name.trim(), category);
            // Jika ada saldo awal, buat transaksi income untuk isi saldo
            const initialBalance = (data.initial_balance as number) ?? 0;
            if (initialBalance > 0) {
              const { db } = await import("@/lib/db");
              await db.transactions.add({
                id: `trn_${Date.now()}`,
                type: "income",
                amount: initialBalance,
                category: "Lainnya",
                merchant: `Saldo awal ${name.trim()}`,
                payment_method: "Lainnya",
                pocketId,
                timestamp: Date.now(),
              });
            }
            break;
          }
        }
        setShowPreview(false);
        onClose();
      } catch (err) {
        console.error("Save error:", err);
      }
    },
    [onClose]
  );

  const handleCancel = useCallback(() => {
    setShowPreview(false);
  }, []);

  // Show preview when a parsed message arrives
  React.useEffect(() => {
    if (lastParsedMsg) {
      setShowPreview(true);
    }
  }, [lastParsedMsg]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet — mobile: bottom sheet, desktop: floating panel */}
      <div className={"fixed z-50 flex flex-col bg-surface-alt shadow-xl bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl animate-slide-up lg:left-auto lg:right-6 lg:bottom-5 lg:w-96 lg:h-auto lg:max-h-150 lg:rounded-2xl lg:animate-none"}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-secondary">
              <Bot className="w-5 h-5 text-white m-auto" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary">
                Finny
              </span>
              <span className="text-xs text-text-muted">Asisten Keuangan</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <FinnyChatArea messages={messages} isLoading={isLoading} />

          {/* Transaction Preview */}
          {showPreview && lastParsedMsg && (
            <div className="pb-3">
              <TransactionPreview
                action={lastParsedMsg.action!}
                data={lastParsedMsg.data}
                pockets={pocketInfo}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>

        {/* Input */}
        <FinnyInput
          onSend={handleSend}
          isLoading={isLoading}
          isOffline={isOffline}
          onScan={onScan}
        />
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default FinnySheet;
