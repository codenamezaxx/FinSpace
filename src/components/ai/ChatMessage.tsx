"use client";

import { Bot, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface ChatMessageProps {
  role: "user" | "bot";
  text: string;
  timestamp?: number;
}

export function ChatMessage({ role, text, timestamp }: ChatMessageProps) {
  const { lang } = useLanguage();
  const isBot = role === "bot";
  const locale = lang === "id" ? "id-ID" : "en-US";

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isBot
            ? "bg-accent-secondary text-white"
            : "bg-surface-alt text-text-secondary"
        }`}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] ${isBot ? "" : "items-end flex flex-col"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isBot
              ? "rounded-tl-sm bg-surface-alt text-text-secondary"
              : "rounded-tr-sm bg-primary text-white"
          }`}
        >
          {text}
        </div>
        {timestamp && (
          <span className="mt-1 px-1 text-[10px] text-text-muted">
            {new Date(timestamp).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
