"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bot,
  Pencil,
  Plus,
  Trash2,
  MessageSquareText,
  PanelLeft,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useFinnyChat, type PocketInfo } from "@/hooks/useFinnyChat";
import { useFinnySave } from "@/hooks/useFinnySave";
import { useFinnyContext } from "@/hooks/useFinnyContext";
import { usePockets } from "@/hooks/usePockets";
import FinnyChatArea from "@/components/ai/FinnyChatArea";
import type { FinnyMessage } from "@/components/ai/FinnyChatArea";
import FinnyInput from "@/components/ai/FinnyInput";
import TransactionPreview from "@/components/ai/TransactionPreview";
import ScanResultModal from "@/components/ai/ScanResultModal";
import CameraOverlay from "@/components/shared/CameraOverlay";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useFinnyScan } from "@/hooks/useFinnyScan";
import { db } from "@/lib/db";

function formatSessionDate(ts: number, lang: string): string {
  return new Date(ts).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

export default function FinnyRoomPage() {
  const { lang, t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const autoSelectedRef = useRef(false);

  const commitRename = useCallback(async () => {
    if (!renamingId) return;
    const id = renamingId;
    const name = renameDraft.trim().slice(0, 60);
    setRenamingId(null);
    if (!name) return;
    try {
      await db.finny_sessions.update(id, { title: name, updatedAt: Date.now() });
    } catch {
      // ignore — the list simply keeps the old title
    }
  }, [renamingId, renameDraft]);
  // Portals need document (client-only) — avoids SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const sessions =
    useLiveQuery(
      () => db.finny_sessions.orderBy("updatedAt").reverse().toArray(),
      []
    ) ?? [];

  const { messages, isLoading, isOffline, sendMessage, activeSessionId } =
    useFinnyChat({
      sessionId: selectedId,
      persist: true,
      onSessionCreated: setSelectedId,
    });

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

  // Receipt scan (same flow as the floating sheet)
  const {
    result: scanResult,
    isLoading: scanLoading,
    error: scanError,
    scanImage,
    reset: resetScan,
  } = useFinnyScan();
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanImageDataUrl, setScanImageDataUrl] = useState<string | null>(null);

  const pocketInfo: PocketInfo[] = useMemo(
    () =>
      pocketEnts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    [pocketEnts]
  );

  const handleScanClick = useCallback(() => {
    resetScan();
    setIsScanOpen(true);
  }, [resetScan]);

  const handleScanImage = useCallback(
    (dataUrl: string) => {
      setScanImageDataUrl(dataUrl);
      scanImage(dataUrl, pocketInfo);
    },
    [scanImage, pocketInfo]
  );

  const handleScanClose = useCallback(() => {
    setIsScanOpen(false);
    setScanImageDataUrl(null);
    resetScan();
  }, [resetScan]);

  const handleScanRetry = useCallback(() => {
    if (scanImageDataUrl) scanImage(scanImageDataUrl, pocketInfo);
  }, [scanImageDataUrl, scanImage, pocketInfo]);

  const handleScanSave = useCallback(
    async (action: string, data: Record<string, unknown>) => {
      try {
        await saveData(action, data);
        handleScanClose();
      } catch (err) {
        console.error("Scan save error:", err);
      }
    },
    [saveData, handleScanClose]
  );

  const handleSend = useCallback(
    (text: string) => sendMessage(text, pocketInfo, lang, finnyContext),
    [sendMessage, pocketInfo, lang, finnyContext]
  );

  const effectiveId = activeSessionId ?? selectedId;

  // Auto-resume the most recent session on first open
  useEffect(() => {
    if (!autoSelectedRef.current && sessions.length > 0 && !selectedId) {
      autoSelectedRef.current = true;
      setSelectedId(sessions[0].id);
    }
  }, [sessions, selectedId]);

  // Hide stale preview when switching sessions
  useEffect(() => {
    setShowPreview(false);
  }, [effectiveId]);

  // Find the last AI message with actionable data
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

  useEffect(() => {
    if (lastParsedMsg) setShowPreview(true);
  }, [lastParsedMsg]);

  const handleSave = useCallback(
    async (action: string, data: Record<string, unknown>) => {
      try {
        await saveData(action, data);
        setShowPreview(false);
      } catch (err) {
        console.error("Save error:", err);
      }
    },
    [saveData]
  );

  const handleNewChat = useCallback(() => {
    setSelectedId(null);
    setShowPreview(false);
    setListOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await db.finny_messages.where("sessionId").equals(sessionToDelete).delete();
      await db.finny_sessions.delete(sessionToDelete);
      if (sessionToDelete === effectiveId) setSelectedId(null);
      setSessionToDelete(null);
    } finally {
      setDeleting(false);
    }
  }, [sessionToDelete, effectiveId]);

  const sessionList = (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={handleNewChat}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-all hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" />
        {t("ai.new_chat")}
      </button>
      <p className="mb-2 px-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {t("ai.chat_sessions")}
      </p>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
            <MessageSquareText className="h-8 w-8 text-text-muted" />
            <p className="text-xs text-text-muted">{t("ai.no_sessions")}</p>
          </div>
        )}
        {sessions.map((s) => {
          const isActive = s.id === effectiveId;
          return (
            <div
              key={s.id}
              className={`group flex items-center gap-1 rounded-xl px-2 py-1 transition-colors ${
                isActive ? "bg-primary/10" : "hover:bg-surface"
              }`}
            >
              {renamingId === s.id ? (
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitRename();
                    else if (e.key === "Escape") setRenamingId(null);
                  }}
                  onBlur={() => void commitRename()}
                  aria-label={t("ai.rename_chat")}
                  className="my-1 min-w-0 flex-1 rounded-lg border border-primary/50 bg-surface px-3 py-1.5 text-sm font-medium text-text-primary outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(s.id);
                    setListOpen(false);
                  }}
                  className="min-w-0 flex-1 px-2 py-2 text-left"
                >
                  <p
                    className={`truncate text-sm font-medium ${
                      isActive ? "text-primary" : "text-text-primary"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                    {formatSessionDate(s.updatedAt, lang)}
                  </p>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setRenamingId(s.id);
                  setRenameDraft(s.title);
                }}
                className="shrink-0 rounded-lg p-1.5 text-text-muted transition-all hover:bg-surface-alt hover:text-primary focus:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label={t("ai.rename_chat")}
                title={t("ai.rename_chat")}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSessionToDelete(s.id)}
                className="shrink-0 rounded-lg p-1.5 text-text-muted transition-all hover:bg-surface-alt hover:text-danger focus:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label={t("ai.delete_session_title")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 lg:px-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-primary lg:hidden"
          aria-label={t("ai.chat_sessions")}
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-secondary">
          <Bot className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-text-primary">Finny</h1>
          <p className="truncate text-xs text-text-muted">{t("ai.assistant_title")}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Session list — desktop static */}
        <aside className="hidden min-h-0 rounded-2xl border border-border bg-surface-alt p-3 lg:block lg:h-[calc(100dvh-11rem)]">
          {sessionList}
        </aside>

        {/* Session list — mobile drawer (portaled: escapes the <main>
            stacking context so TopBar never paints over it) */}
        {mounted &&
          createPortal(
            <div
              className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
                listOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setListOpen(false)}
          />
          <aside
            className={`absolute bottom-0 left-0 top-0 w-72 max-w-[85vw] border-r border-border bg-surface-alt p-3 shadow-2xl transition-transform duration-300 ease-out ${
              listOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-text-primary">
                {t("ai.chat_sessions")}
              </span>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sessionList}
          </aside>
            </div>,
            document.body
          )}

        {/* Chat column */}
        <div className="flex h-[calc(100dvh-13rem)] min-h-[60dvh] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-alt lg:h-[calc(100dvh-11rem)]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <FinnyChatArea messages={messages} isLoading={isLoading} />
            {showPreview && lastParsedMsg && (
              <div className="shrink-0 pb-3">
                <TransactionPreview
                  action={lastParsedMsg.action!}
                  data={lastParsedMsg.data}
                  pockets={pocketInfo}
                  onSave={handleSave}
                  onCancel={() => setShowPreview(false)}
                />
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-border">
            <FinnyInput
              onSend={handleSend}
              isLoading={isLoading}
              isOffline={isOffline}
              onScan={handleScanClick}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("ai.delete_session_title")}
        message={t("ai.delete_session_message")}
        confirmLabel={t("common.delete")}
        isLoading={deleting}
      />

      {/* Portaled to document.body: the AppShell <main> establishes its own
          stacking context (relative z-10), which would otherwise trap these
          fixed overlays BELOW the sidebar/topbar (see camera screenshot). */}
      {mounted &&
        createPortal(
          <>
            <CameraOverlay
              isOpen={isScanOpen && !scanImageDataUrl}
              onCapture={handleScanImage}
              onClose={handleScanClose}
            />
            <ScanResultModal
              isOpen={isScanOpen && !!scanImageDataUrl}
              imageDataUrl={scanImageDataUrl}
              result={scanResult}
              isLoading={scanLoading}
              error={scanError}
              onSave={handleScanSave}
              onClose={handleScanClose}
              onRetry={handleScanRetry}
              pockets={pocketInfo}
            />
          </>,
          document.body
        )}
    </div>
  );
}
