"use client";

import { useRef, useEffect, useState, useCallback, type FC } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { ArrowDown, Bot } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface FinnyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  data?: Record<string, unknown>;
  missingFields?: string[];
  confidence?: string;
}

interface FinnyChatAreaProps {
  messages: FinnyMessage[];
  isLoading: boolean;
}

const NEAR_BOTTOM_PX = 120;

const FinnyChatArea: FC<FinnyChatAreaProps> = ({ messages, isLoading }) => {
  const { t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether the view is pinned to the bottom: new messages only auto-scroll
  // when pinned, so reading history up top is never yanked away.
  const pinnedRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current ?? bottomRef.current?.parentElement;
    if (!el) return;
    pinnedRef.current = true;
    setShowJump(false);
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const pinned = distFromBottom <= NEAR_BOTTOM_PX;
    pinnedRef.current = pinned;
    setShowJump(!pinned);
  }, []);

  useEffect(() => {
    // Freshly loaded history (e.g. opening a session) always starts pinned.
    if (messages.length === 0) {
      pinnedRef.current = true;
      setShowJump(false);
    }
    if (pinnedRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">
            <Bot className="w-12 h-12 text-accent-secondary m-auto" />
          </div>
          <p className="text-text-secondary text-sm">
            {t("ai.welcome")}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {t("ai.welcome_hint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      <button
        type="button"
        onClick={() => scrollToBottom(true)}
        aria-label={t("ai.scroll_to_bottom")}
        className={`absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-hover ${
          showJump
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ArrowDown className="h-5 w-5" />
      </button>
    </div>
  );
};

export default FinnyChatArea;
