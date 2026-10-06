"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type FinnyChatRow } from "@/lib/db";
import {
  newAiQueueId,
  newFinnyAssistantMessageId,
  newFinnySessionId,
  newFinnyUserMessageId,
} from "@/lib/ids";

export interface FinnyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  data?: Record<string, unknown>;
  missingFields?: string[];
  confidence?: string;
  /** Monotonic timestamp used for stable ordering of persisted history. */
  createdAt?: number;
}

function generateId(): string {
  return newFinnyUserMessageId();
}

/** Derive a session title from the first user message. Exported for tests. */
export function sessionTitleFor(text: string, max = 42): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/**
 * True only while the session still carries its auto-generated title —
 * i.e. the user has NOT renamed it manually. Guards the AI-title pass
 * from overwriting a deliberate rename.
 */
export function shouldApplyAiTitle(
  currentTitle: string,
  firstUserText: string
): boolean {
  return currentTitle === sessionTitleFor(firstUserText);
}

interface RawAiResponse {
  action: string;
  message: string;
  data?: Record<string, unknown>;
  missing_fields?: string[];
  confidence?: string;
}

function parseAiResponse(content: string): RawAiResponse | null {
  try {
    return JSON.parse(content) as RawAiResponse;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as RawAiResponse;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface PocketInfo {
  id: string;
  name: string;
  category: "tunai" | "ewallet" | "rekening";
}

export interface UseFinnyChatOptions {
  /** Resume this persisted session. Omit/null = ephemeral (unless persist creates one). */
  sessionId?: string | null;
  /** Persist turns to Dexie (sessions list + messages) so chats survive reloads. */
  persist?: boolean;
  /** Called with the new id the first time a session row is created. */
  onSessionCreated?: (id: string) => void;
}

export interface UseFinnyChatResult {
  messages: FinnyMessage[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  sendMessage: (
    text: string,
    pockets?: PocketInfo[],
    language?: string,
    context?: string
  ) => Promise<void>;
  clearMessages: () => void;
  dismissError: () => void;
  /** Currently active persisted session id (null while ephemeral). */
  activeSessionId: string | null;
  /** Discard current state and start a fresh (ephemeral until first send) session. */
  startNewSession: () => void;
}

function toRow(sessionId: string, m: FinnyMessage): FinnyChatRow {
  return {
    id: m.id,
    sessionId,
    role: m.role,
    content: m.content,
    action: m.action,
    data: m.data,
    missingFields: m.missingFields,
    confidence: m.confidence,
    createdAt: m.createdAt ?? Date.now(),
  };
}

function fromRow(r: FinnyChatRow): FinnyMessage {
  return {
    id: r.id,
    role: r.role,
    content: r.content,
    action: r.action,
    data: r.data,
    missingFields: r.missingFields,
    confidence: r.confidence,
    createdAt: r.createdAt,
  };
}

export function useFinnyChat(options?: UseFinnyChatOptions): UseFinnyChatResult {
  const persist = options?.persist ?? false;
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    options?.sessionId ?? null
  );
  const [messages, setMessages] = useState<FinnyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Refs mirroring state for use inside async flows/effects
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  const seededForRef = useRef<string | null>(null);
  const tsRef = useRef(0);
  const onSessionCreatedRef = useRef(options?.onSessionCreated);
  onSessionCreatedRef.current = options?.onSessionCreated;

  /** Monotonic timestamp so persisted history keeps exact send order. */
  const stamp = useCallback((): number => {
    const n = Date.now();
    tsRef.current = Math.max(n, tsRef.current + 1);
    return tsRef.current;
  }, []);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handler = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  // Follow session switches (roomchat): reset state, history reseeds from DB below
  useEffect(() => {
    const sid = options?.sessionId ?? null;
    if (sid === activeSessionIdRef.current) return;
    abortRef.current?.abort();
    abortRef.current = null;
    activeSessionIdRef.current = sid;
    setActiveSessionId(sid);
    seededForRef.current = null;
    setMessages([]);
    setError(null);
  }, [options?.sessionId]);

  // Load persisted history for the active session (once per session).
  // NOTE: the querier must stay SYNCHRONOUS (static db import) — an async
  // querier with a dynamic import breaks liveQuery change tracking, so new
  // rows never arrive and history silently stays empty.
  const stored = useLiveQuery(() => {
    if (!persist || !activeSessionId) return [];
    return db.finny_messages
      .where("sessionId")
      .equals(activeSessionId)
      .toArray()
      .then((rows) =>
        rows.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      );
  }, [persist, activeSessionId]);

  useEffect(() => {
    if (!persist || !activeSessionId) return;
    if (seededForRef.current === activeSessionId) return;
    if (stored === undefined || stored.length === 0) return;
    // liveQuery keeps emitting the PREVIOUS session's rows until the new
    // subscription resolves — never seed those into this session, or
    // selecting A would briefly (and, combined with the mark below,
    // permanently) show B's chat.
    if (stored.some((r) => r.sessionId !== activeSessionId)) return;
    seededForRef.current = activeSessionId;
    // Only fill an empty view — never clobber a live turn already in state
    // (its messages are persisted separately via persistBatch).
    setMessages((prev) => (prev.length === 0 ? stored.map(fromRow) : prev));
  }, [persist, activeSessionId, stored]);

  const ensureSession = useCallback(
    async (firstText: string): Promise<string | null> => {
      if (!persist) return activeSessionIdRef.current;
      if (activeSessionIdRef.current) return activeSessionIdRef.current;
      const id = newFinnySessionId();
      const now = Date.now();
      await db.finny_sessions.add({
        id,
        title: sessionTitleFor(firstText),
        createdAt: now,
        updatedAt: now,
      });
      activeSessionIdRef.current = id;
      setActiveSessionId(id);
      onSessionCreatedRef.current?.(id);
      return id;
    },
    [persist]
  );

  // Ask the model for a short topic title for a brand-new session.
  // Fire-and-forget: the truncated user text stays as fallback, and a
  // manual rename always wins (checked before applying).
  const requestAiTitle = useCallback(
    async (
      sid: string,
      firstUserText: string,
      firstAssistantText: string,
      lang: string | undefined
    ): Promise<void> => {
      try {
        const prompt =
          lang === "en"
            ? `Create a very short chat title (max 5 words, no quotation marks) summarizing the topic of this conversation:\nUser: ${firstUserText}\nFinny: ${firstAssistantText}`
            : `Buatkan judul chat yang sangat singkat (maks 5 kata, tanpa tanda kutip) yang merangkum topik percakapan ini:\nUser: ${firstUserText}\nFinny: ${firstAssistantText}`;
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            pockets: [],
            language: lang ?? "id",
          }),
        });
        if (!res.ok) return;
        const text = await res.text();
        const parsed = parseAiResponse(text);
        const raw = ((parsed?.message ?? text) || "")
          .trim()
          .replace(/^["'“”«»]+|["'“”«».,;:!?]+$/g, "")
          .trim();
        if (!raw) return;
        const { db } = await import("@/lib/db");
        const sess = await db.finny_sessions.get(sid);
        if (sess && shouldApplyAiTitle(sess.title, firstUserText)) {
          await db.finny_sessions.update(sid, {
            title: sessionTitleFor(raw, 40),
            updatedAt: Date.now(),
          });
        }
      } catch {
        // Title upgrade is best-effort only
      }
    },
    []
  );

  // Durably persist each message batch inline (awaited inside sendMessage),
  // so a reload/close can never lose a finished turn. Failures are logged —
  // never swallowed — to keep persistence bugs diagnosable.
  const persistBatch = useCallback(
    async (sid: string | null, batch: FinnyMessage[]): Promise<void> => {
      if (!persist || !sid || batch.length === 0) return;
      try {
        await db.finny_messages.bulkPut(batch.map((m) => toRow(sid, m)));
        await db.finny_sessions.update(sid, { updatedAt: Date.now() });
      } catch (e) {
        console.error("[Finny] failed to persist chat turn:", e);
      }
    },
    [persist]
  );

  const sendMessage = useCallback(
    async (
      text: string,
      pockets?: PocketInfo[],
      language?: string,
      context?: string
    ) => {
      if (!text.trim() || isLoading) return;

      const userMsg: FinnyMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        createdAt: stamp(),
      };
      // Assistant ids must ALSO carry the table prefix (Fnn…) — Dexie
      // Cloud rejects anything else, so derive one stable id per turn.
      const asstId = newFinnyAssistantMessageId();

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      // Lazily create the persisted session on first send (no-op when ephemeral)
      const hadSession = !!activeSessionIdRef.current;
      let sid: string | null = null;
      try {
        sid = await ensureSession(text.trim());
      } catch (e) {
        // Persistence unavailable — continue as an ephemeral chat
        console.error("[Finny] ensureSession failed:", e);
      }
      await persistBatch(sid, [userMsg]);

      if (!navigator.onLine) {
        try {
          await db.ai_queue.add({
            queue_id: newAiQueueId(),
            input_type: "text_chat",
            payload: text.trim(),
            created_at: Date.now(),
          });
        } catch {
          // Silently fail
        }

        const offlineMsg: FinnyMessage = {
          id: generateId(),
          role: "assistant",
          content: language === "en"
            ? "Your message has been queued. I'll process it when you're back online! 🙏"
            : "Pesanmu sudah masuk antrean. Aku akan proses saat online kembali ya! 🙏",
          action: "chat",
          createdAt: stamp(),
        };
        setMessages((prev) => [...prev, offlineMsg]);
        await persistBatch(sid, [offlineMsg]);
        setIsLoading(false);
        return;
      }

      try {
        abortRef.current = new AbortController();
        const history = messages
          .concat(userMsg)
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            pockets: pockets ?? [],
            language: language ?? "id",
            context: context ?? "",
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData: Record<string, unknown> = await response
            .json()
            .catch(() => ({}));

          // Rate limit — tampilkan sebagai pesan asisten, bukan error
          if (response.status === 429 && typeof errData.message === "string") {
            const rateLimitMsg: FinnyMessage = {
              id: asstId,
              role: "assistant",
              content: errData.message,
              action:
                typeof errData.action === "string"
                  ? errData.action
                  : "chat",
              createdAt: stamp(),
            };
            setMessages((prev) => [...prev, rateLimitMsg]);
            await persistBatch(sid, [rateLimitMsg]);
            setIsLoading(false);
            return;
          }

          throw new Error(
            typeof errData.error === "string"
              ? errData.error
              : language === "en"
                ? "Failed to connect to Finny"
                : "Gagal terhubung ke Finny"
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === asstId) {
              return [
                ...prev.slice(0, -1),
                { ...last, content: fullContent },
              ];
            }
            return prev;
          });
        }

        const parsed = parseAiResponse(fullContent);
        const finalMsg: FinnyMessage = {
          id: asstId,
          role: "assistant",
          content:
            (parsed?.message ?? fullContent) ||
            (language === "en"
              ? "Sorry, something went wrong. Please ask again! 🙏"
              : "Maaf, sepertinya ada gangguan. Coba tanya lagi ya! 🙏"),
          action: parsed?.action,
          data: parsed?.data,
          missingFields: parsed?.missing_fields,
          confidence: parsed?.confidence,
          createdAt: stamp(),
        };

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === asstId) {
            return [...prev.slice(0, -1), finalMsg];
          }
          return [...prev, finalMsg];
        });
        await persistBatch(sid, [finalMsg]);
        // First turn of a brand-new persisted session → upgrade its title
        // with an AI topic summary in the background (manual renames win).
        if (sid && !hadSession) {
          void requestAiTitle(sid, text.trim(), finalMsg.content, language);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorMsg =
          (err as Error).message ||
          (language === "en"
            ? "Sorry, connection issue. Please try again!"
            : "Maaf, ada masalah koneksi. Coba lagi ya!");
        setError(errorMsg);

        const errAiMsg: FinnyMessage = {
          id: asstId,
          role: "assistant",
          content: language === "en"
            ? "Sorry, I'm having trouble. Please try again! 🙏"
            : "Maaf, aku lagi bermasalah. Coba lagi ya! 🙏",
          action: "chat",
          createdAt: stamp(),
        };
        setMessages((prev) => [...prev, errAiMsg]);
        await persistBatch(sid, [errAiMsg]);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading, ensureSession, persistBatch, requestAiTitle, stamp]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  const startNewSession = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    activeSessionIdRef.current = null;
    seededForRef.current = null;
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isOffline,
    error,
    sendMessage,
    clearMessages,
    dismissError,
    activeSessionId,
    startNewSession,
  };
}
