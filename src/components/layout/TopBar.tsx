"use client";

import { useState, useCallback, useRef } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileButton } from "./ProfileButton";
import { SearchDropdown } from "./SearchDropdown";
import { useSearch } from "@/hooks/useSearch";

interface TopBarProps {
  isSidebarCollapsed?: boolean;
}

export function TopBar({ isSidebarCollapsed = false }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading } = useSearch(searchQuery);

  const showDropdown = isFocused && (searchQuery.trim().length >= 2 || results !== null || searchQuery.trim().length < 2);

  const handleClose = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleMobileOpen = useCallback(() => {
    setSearchOpen(true);
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>('[data-search-input="mobile"]');
      input?.focus();
    });
  }, []);

  const handleMobileBack = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    handleClose();
  }, [handleClose]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 lg:px-4 border-b border-border bg-surface-alt transition-all duration-300 ${
        isSidebarCollapsed ? "lg:left-[72px]" : "lg:left-64"
      }`}
    >
      <div className="relative flex h-16 items-center gap-3 px-4">
        {/* ── LEFT SIDE ── */}

        {/* Mobile: back button when search open */}
        {searchOpen && (
          <button
            onClick={handleMobileBack}
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

        {/* Mobile: search input (when open) */}
        {searchOpen && (
          <div className="relative flex-1 lg:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              data-search-input="mobile"
              type="search"
              placeholder="Cari transaksi, aset, alat..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              autoFocus
              className="w-full rounded-xl border border-border bg-surface-alt py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
            {showDropdown && (
              <SearchDropdown
                query={searchQuery}
                results={results}
                loading={loading}
                onClose={handleClose}
              />
            )}
          </div>
        )}

        {/* Desktop: search bar */}
        <div className="relative hidden flex-1 max-w-md lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Cari transaksi, aset, alat..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
          {showDropdown && (
            <SearchDropdown
              query={searchQuery}
              results={results}
              loading={loading}
              onClose={handleClose}
            />
          )}
        </div>

        {/* ── SPACER ── */}
        <div className={`flex-1 ${searchOpen ? 'hidden lg:block' : ''}`} />

        {/* ── RIGHT SIDE ── */}

        {/* Mobile: search icon */}
        {!searchOpen && (
          <button
            onClick={handleMobileOpen}
            className="flex items-center justify-center rounded-lg p-2 text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary lg:hidden"
            aria-label="Cari transaksi"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* Theme toggle */}
        <div className="hidden lg:block">
          <ThemeToggle compact />
        </div>

        {/* Profile */}
        <ProfileButton />
      </div>
    </header>
  );
}
