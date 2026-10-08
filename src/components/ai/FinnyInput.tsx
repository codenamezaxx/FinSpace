"use client";

import {
  useState,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
  type KeyboardEvent,
} from "react";
import { Send, WifiOff, Camera } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface FinnyInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  isOffline: boolean;
  onScan?: () => void;
}

export interface FinnyInputHandle {
  /** Refill the input (e.g. with an unsent message) and focus it. */
  insertText: (text: string) => void;
}

const MAX_HEIGHT = 160;

const FinnyInput = forwardRef<FinnyInputHandle, FinnyInputProps>(function FinnyInput(
  { onSend, isLoading, isOffline, onScan },
  ref
) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const autoresize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  const handleSend = useCallback(() => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText("");
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  }, [text, isLoading, onSend]);

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      requestAnimationFrame(autoresize);
    },
    [autoresize]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter = send, Shift+Enter = new paragraph
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  useImperativeHandle(
    ref,
    () => ({
      insertText: (value: string) => {
        setText(value);
        requestAnimationFrame(() => {
          autoresize();
          taRef.current?.focus();
        });
      },
    }),
    [autoresize]
  );

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div className="flex items-end gap-2 border-t border-border bg-surface-alt p-3 lg:rounded-b-2xl">
      {isOffline && (
        <div className="flex items-center gap-1 text-xs text-text-muted mr-1 pb-2.5">
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </div>
      )}
      <textarea
        ref={taRef}
        rows={1}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("ai.input_placeholder")}
        disabled={isLoading}
        className="max-h-40 flex-1 resize-none overflow-y-auto rounded-xl bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        maxLength={1000}
      />
      {onScan && (
        <button
          onClick={onScan}
          disabled={isLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-border"
          aria-label={t("ai.scan_receipt")}
        >
          <Camera className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
        aria-label={t("ai.send_message")}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
});

export default FinnyInput;
