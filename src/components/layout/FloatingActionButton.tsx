"use client";

import { Sparkles } from "lucide-react";

export function FloatingActionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl active:scale-95 lg:bottom-8"
      aria-label="Buka Asisten AI"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}
