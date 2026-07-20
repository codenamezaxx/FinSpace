"use client";

import type { FC } from "react";

const TypingIndicator: FC = () => {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
