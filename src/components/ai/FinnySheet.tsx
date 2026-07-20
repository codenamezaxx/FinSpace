"use client";

import React, { useState, useCallback, type FC } from "react";
import { X } from "lucide-react";
import { useFinnyChat } from "@/hooks/useFinnyChat";
import FinnyChatArea from "./FinnyChatArea";
import FinnyInput from "./FinnyInput";
import TransactionPreview from "./TransactionPreview";
import type { FinnyMessage } from "./FinnyChatArea";

interface FinnySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const FinnySheet: FC<FinnySheetProps> = ({ isOpen, onClose }) => {
  const { messages, isLoading, isOffline, sendMessage } = useFinnyChat();
  const [showPreview, setShowPreview] = useState(false);

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
            await db.transactions.add({
              id: `tx_${Date.now()}`,
              type: data.type as "income" | "expense",
              amount: data.amount as number,
              category: data.category as string,
              merchant: data.merchant as string,
              payment_method: data.payment_method as string,
              timestamp: Date.now(),
            });
            break;
          }
          case "asset": {
            const assets = JSON.parse(
              localStorage.getItem("finspace_assets") ?? "[]"
            );
            assets.push({
              id: `asset_${Date.now()}`,
              name: data.name as string,
              amount: data.amount as number,
              type: data.asset_type as string,
              createdAt: Date.now(),
            });
            localStorage.setItem("finspace_assets", JSON.stringify(assets));
            break;
          }
          case "liability": {
            const liabilities = JSON.parse(
              localStorage.getItem("finspace_liabilities") ?? "[]"
            );
            liabilities.push({
              id: `liab_${Date.now()}`,
              name: data.name as string,
              amount: data.amount as number,
              createdAt: Date.now(),
            });
            localStorage.setItem(
              "finspace_liabilities",
              JSON.stringify(liabilities)
            );
            break;
          }
          case "debt": {
            const debts = JSON.parse(
              localStorage.getItem("finspace_debts") ?? "[]"
            );
            debts.push({
              id: `debt_${Date.now()}`,
              name: data.name as string,
              totalAmount: data.totalAmount as number,
              paidAmount: (data.paidAmount as number) ?? 0,
              dueDate: data.dueDate
                ? new Date(data.dueDate as string).getTime()
                : Date.now() + 365 * 86400000,
              interestRate: (data.interestRate as number) ?? undefined,
              createdAt: Date.now(),
            });
            localStorage.setItem("finspace_debts", JSON.stringify(debts));
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
      <div className={"fixed z-50 flex flex-col bg-surface-alt shadow-xl bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl animate-slide-up lg:left-auto lg:right-8 lg:bottom-36 lg:w-96 lg:max-h-[600px] lg:rounded-2xl lg:animate-none"}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
            <span className="text-sm font-semibold text-text-primary">
              Finny
            </span>
            <span className="text-xs text-text-muted">Asisten Keuangan</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
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
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>

        {/* Input */}
        <FinnyInput
          onSend={sendMessage}
          isLoading={isLoading}
          isOffline={isOffline}
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
