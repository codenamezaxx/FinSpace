"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { NavigationBar } from "./NavigationBar";
import { TopBar } from "./TopBar";
import { FloatingActionButton } from "./FloatingActionButton";
import { ChatbotSheet } from "@/components/ai/ChatbotSheet";

export function AppShell({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Subtle radial glow behind content — shows through glass cards */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "var(--glow-primary)" }} />
        <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "var(--glow-accent)" }} />
      </div>

      <NavigationBar />
      <TopBar />
      <main className="relative z-10 flex-1 pt-16 pb-20 lg:pb-0 lg:ml-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          {children}
        </div>
      </main>
      <FloatingActionButton onClick={() => setIsChatOpen(true)} />
      <ChatbotSheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
