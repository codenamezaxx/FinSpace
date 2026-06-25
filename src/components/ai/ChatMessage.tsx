"use client";

import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "bot";
  text: string;
  timestamp?: number;
}

export function ChatMessage({ role, text, timestamp }: ChatMessageProps) {
  const isBot = role === "bot";

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
              ? "rounded-tl-sm glass text-text-secondary"
              : "rounded-tr-sm bg-primary text-white"
          }`}
        >
          {text}
        </div>
        {timestamp && (
          <span className="mt-1 px-1 text-[10px] text-text-muted">
            {new Date(timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
