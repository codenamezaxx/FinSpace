"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Sparkles } from "lucide-react";
import { ChatMessage } from "./ChatMessage";

interface ChatMessageData {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

interface ChatbotSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGES: ChatMessageData[] = [
  {
    id: "welcome-1",
    role: "bot",
    text: "Halo! Saya Finny, asisten keuangan pribadi Anda. Ada yang bisa saya bantu?",
    timestamp: Date.now() - 60000,
  },
  {
    id: "welcome-2",
    role: "bot",
    text: "Coba ketik 'catat pengeluaran makan siang 35 ribu' — saya akan bantu mencatat transaksi Anda!",
    timestamp: Date.now() - 30000,
  },
];

export function ChatbotSheet({ isOpen, onClose }: ChatbotSheetProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShowSheet(true);
      if (messages.length === 0) {
        setMessages(INITIAL_MESSAGES);
      }
    } else {
      const timer = setTimeout(() => setShowSheet(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    const userMsg: ChatMessageData = {
      id: crypto.randomUUID(),
      role: "user",
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg: ChatMessageData = {
        id: crypto.randomUUID(),
        role: "bot",
        text: `Terima kasih! Saya telah mencatat: "${input.trim()}". Fitur AI penuh akan segera hadir.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen && !showSheet) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        style={{ background: "var(--backdrop-bg)" }}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col glass shadow-2xl shadow-black/40 transition-transform duration-300 ease-out lg:left-auto lg:right-4 lg:bottom-4 lg:w-96 lg:rounded-2xl ${
          isOpen
            ? "translate-y-0"
            : "translate-y-full"
        }`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-alt px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-secondary text-white shadow-md shadow-accent-secondary/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Finny</h2>
              <p className="text-[10px] text-text-muted">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-alt hover:text-primary"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              text={msg.text}
              timestamp={msg.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
