"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface FinnyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  data?: Record<string, unknown>;
  missingFields?: string[];
  confidence?: string;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

export interface UseFinnyChatResult {
  messages: FinnyMessage[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  dismissError: () => void;
}

export function useFinnyChat(): UseFinnyChatResult {
  const [messages, setMessages] = useState<FinnyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: FinnyMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      if (!navigator.onLine) {
        try {
          const { db } = await import("@/lib/db");
          await db.ai_queue.add({
            queue_id: `ai_${Date.now()}`,
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
          content: "Pesanmu sudah masuk antrean. Aku akan proses saat online kembali ya! 🙏",
          action: "chat",
        };
        setMessages((prev) => [...prev, offlineMsg]);
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
          body: JSON.stringify({ messages: history }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData: Record<string, unknown> = await response
            .json()
            .catch(() => ({}));

          // Rate limit — tampilkan sebagai pesan asisten, bukan error
          if (response.status === 429 && typeof errData.message === "string") {
            const rateLimitMsg: FinnyMessage = {
              id: `ai_${userMsg.id}`,
              role: "assistant",
              content: errData.message,
              action:
                typeof errData.action === "string"
                  ? errData.action
                  : "chat",
            };
            setMessages((prev) => [...prev, rateLimitMsg]);
            setIsLoading(false);
            return;
          }

          throw new Error(
            typeof errData.error === "string"
              ? errData.error
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
            if (last?.role === "assistant" && last.id === `ai_${userMsg.id}`) {
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
          id: `ai_${userMsg.id}`,
          role: "assistant",
          content:
            (parsed?.message ?? fullContent) ||
            "Maaf, sepertinya ada gangguan. Coba tanya lagi ya! 🙏",
          action: parsed?.action,
          data: parsed?.data,
          missingFields: parsed?.missing_fields,
          confidence: parsed?.confidence,
        };

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === `ai_${userMsg.id}`) {
            return [...prev.slice(0, -1), finalMsg];
          }
          return [...prev, finalMsg];
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorMsg =
          (err as Error).message || "Maaf, ada masalah koneksi. Coba lagi ya!";
        setError(errorMsg);

        const errAiMsg: FinnyMessage = {
          id: `ai_${userMsg.id}`,
          role: "assistant",
          content: "Maaf, aku lagi bermasalah. Coba lagi ya! 🙏",
          action: "chat",
        };
        setMessages((prev) => [...prev, errAiMsg]);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const dismissError = useCallback(() => {
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
  };
}
