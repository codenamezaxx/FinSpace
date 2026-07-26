"use client";

import { useRef, useEffect, type FC } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { Bot } from "lucide-react";
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

const FinnyChatArea: FC<FinnyChatAreaProps> = ({ messages, isLoading }) => {
  const { t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
};

export default FinnyChatArea;
