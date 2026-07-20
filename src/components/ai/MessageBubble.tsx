"use client";

import type { FC } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

const MessageBubble: FC<MessageBubbleProps> = ({ role, content }) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary text-white rounded-br-md"
            : "bg-surface text-text-primary rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
