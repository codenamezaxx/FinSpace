"use client";

import React, { useState, useCallback, useMemo, useEffect, type FC } from "react";
import { Bot, X, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useFinnyChat, isActionableMessage, type PocketInfo } from "@/hooks/useFinnyChat";
import { useFinnySave } from "@/hooks/useFinnySave";
import { useFinnyContext } from "@/hooks/useFinnyContext";
import { usePockets } from "@/hooks/usePockets";
import FinnyChatArea from "./FinnyChatArea";
import FinnyInput, { type FinnyInputHandle } from "./FinnyInput";
import TransactionPreview from "./TransactionPreview";

interface FinnySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: () => void;
}

const FinnySheet: FC<FinnySheetProps> = ({ isOpen, onClose, onScan }) => {
  const { lang, t } = useLanguage();
  // persist: true — every floating chat is saved as a resumable session.
  // A fresh session starts each time the sheet opens (see effect below).
  const {
    messages,
    isLoading,
    isOffline,
    sendMessage,
    startNewSession,
    unsendMessage,
  } = useFinnyChat({ persist: true });
  const inputRef = React.useRef<FinnyInputHandle>(null);

  const handleUnsend = useCallback(
    async (id: string) => {
      const text = await unsendMessage(id);
      if (text != null) inputRef.current?.insertText(text);
    },
    [unsendMessage]
  );
  const {
    pockets: pocketEnts,
    addPocket,
    transferBetweenPockets,
  } = usePockets();
  const { handleSave: saveData } = useFinnySave(
    pocketEnts,
    addPocket,
    transferBetweenPockets
  );
  const finnyContext = useFinnyContext();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) startNewSession();
  }, [isOpen, startNewSession]);

  const pocketInfo: PocketInfo[] = useMemo(
    () =>
      pocketEnts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    [pocketEnts]
  );

  // Wrap sendMessage so pockets, language and the financial snapshot
  // are always included
  const handleSend = useCallback(
    (text: string) => sendMessage(text, pocketInfo, lang, finnyContext),
    [sendMessage, pocketInfo, lang, finnyContext]
  );

  // Find the last AI message with transaction data (skipping handled ones)
  const lastParsedMsg = [...messages].reverse().find(isActionableMessage);

  // Mark an action message handled (saved or dismissed) so its preview
  // never resurrects on revisit — re-saving would duplicate the item.
  const markHandled = useCallback(async (id: string) => {
    try {
      const { db } = await import("@/lib/db");
      await db.finny_messages.update(id, { handled: 1 });
      setShowPreview(false);
    } catch {
      setShowPreview(false);
    }
  }, []);

  const handleSave = useCallback(
    async (action: string, data: Record<string, unknown>) => {
      try {
        await saveData(action, data);
        if (lastParsedMsg) await markHandled(lastParsedMsg.id);
        else setShowPreview(false);
        onClose();
      } catch (err) {
        console.error("Save error:", err);
      }
    },
    [saveData, onClose, lastParsedMsg, markHandled]
  );

  const handleCancel = useCallback(() => {
    if (lastParsedMsg) void markHandled(lastParsedMsg.id);
    else setShowPreview(false);
  }, [lastParsedMsg, markHandled]);

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
              <span className="text-xs text-text-muted">{t("ai.assistant_title")}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                window.location.href = "/finny";
              }}
              className="p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
              aria-label={t("ai.open_full_chat")}
              title={t("ai.open_full_chat")}
            >
              <ExternalLink className="w-5 h-5 text-text-secondary" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
              aria-label={t("common.close")}
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <FinnyChatArea
            messages={messages}
            isLoading={isLoading}
            onUnsend={handleUnsend}
          />

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
          ref={inputRef}
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
