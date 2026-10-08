"use client";

import type { FC } from "react";
import { Undo2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  onUnsend?: (id: string) => void;
}

const MessageBubble: FC<MessageBubbleProps> = ({ id, role, content, onUnsend }) => {
  const isUser = role === "user";
  const { t } = useLanguage();

  return (
    <div className={`group flex items-center gap-1.5 ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {isUser && onUnsend && (
        <button
          type="button"
          onClick={() => onUnsend(id)}
          aria-label={t("ai.unsend")}
          title={t("ai.unsend")}
          className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-100 transition-all hover:bg-surface-alt hover:text-text-primary lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary text-on-primary rounded-br-md"
            : "bg-surface text-text-primary rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
