"use client";

import { type FC } from "react";
import { Bot } from "lucide-react";

interface FinnyTriggerProps {
  onClick: () => void;
}

const FinnyTrigger: FC<FinnyTriggerProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary text-white shadow-lg cursor-pointer hover:opacity-90 transition-all active:scale-95"
      aria-label="Buka Finny AI"
    >
      <Bot className="w-6 h-6 lg:w-7 lg:h-7" />
    </button>
  );
};

export default FinnyTrigger;
