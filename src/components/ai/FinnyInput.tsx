"use client";

import { useState, useCallback, type FC, type KeyboardEvent } from "react";
import { Send, WifiOff, Camera } from "lucide-react";

interface FinnyInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  isOffline: boolean;
  onScan?: () => void;
}

const FinnyInput: FC<FinnyInputProps> = ({ onSend, isLoading, isOffline, onScan }) => {
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText("");
  }, [text, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div className="flex items-center gap-2 border-t border-border bg-surface-alt p-3 lg:rounded-b-2xl">
      {isOffline && (
        <div className="flex items-center gap-1 text-xs text-text-muted mr-1">
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </div>
      )}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik pesan..."
        disabled={isLoading}
        className="flex-1 bg-surface text-text-primary placeholder-text-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        maxLength={1000}
        autoFocus
      />
      {onScan && (
        <button
          onClick={onScan}
          disabled={isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface text-text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-border"
          aria-label="Scan struk"
        >
          <Camera className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
        aria-label="Kirim pesan"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FinnyInput;
