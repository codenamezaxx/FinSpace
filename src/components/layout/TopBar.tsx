"use client";

import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileButton } from "./ProfileButton";

interface TopBarProps {
  isSidebarCollapsed?: boolean;
}

export function TopBar({ isSidebarCollapsed = false }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 border-b border-border bg-surface-alt transition-all duration-300 ${
        isSidebarCollapsed ? "lg:left-[72px]" : "lg:left-64"
      }`}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        {/* ── LEFT SIDE ── */}

        {/* Mobile: back button when search open */}
        {searchOpen && (
          <button
            onClick={() => setSearchOpen(false)}
            className="flex items-center justify-center rounded-lg p-1 text-text-muted transition-colors hover:text-text-primary lg:hidden"
            aria-label="Tutup pencarian"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Mobile: title + icon (hidden when search open) */}
        {!searchOpen && (
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/icons/icon-192x192.svg"
              alt=""
              className="h-6 w-6"
            />
            <span className="text-base font-semibold text-text-primary">
              FinSpace
            </span>
          </div>
        )}

        {/* Mobile: search input (when open) — takes remaining space */}
        {searchOpen && (
          <div className="relative flex-1 lg:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              placeholder="Cari transaksi..."
              autoFocus
              className="w-full rounded-xl border border-border bg-surface-alt py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Desktop: search bar */}
        <div className="relative hidden flex-1 max-w-md lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            placeholder="Cari transaksi..."
            className="w-full rounded-xl border border-border bg-surface-alt py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* ── SPACER: pushes right group to far right ── */}
        <div className={`flex-1 ${searchOpen ? 'hidden lg:block' : ''}`} />

        {/* ── RIGHT SIDE ── */}

        {/* Mobile: search icon (hidden when input is open) */}
        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center rounded-lg p-2 text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary lg:hidden"
            aria-label="Cari transaksi"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* Profile */}
        <div className="hidden sm:block">
          <ProfileButton />
        </div>

        {/* Theme toggle — always on far right */}
        <ThemeToggle compact />
      </div>
    </header>
  );
}
