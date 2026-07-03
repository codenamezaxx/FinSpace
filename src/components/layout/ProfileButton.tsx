"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, Cloud, CloudOff, User, Sun, Moon } from "lucide-react";
import { useCloudAuth } from "@/hooks/useCloudAuth";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

export function ProfileButton() {
  const { user, isLoggedIn, isLoading, login, logout } = useCloudAuth();
  const { toggleTheme } = useTheme();
  const sync = useSyncStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Sync dot color ──
  const dotColor =
    sync.status === "syncing"
      ? "bg-cyan-400"
      : sync.status === "offline"
        ? "bg-amber-400"
        : "bg-success";

  const syncLabel =
    sync.status === "syncing"
      ? "Menyinkronkan..."
      : sync.status === "offline"
        ? "Offline"
        : "Tersinkronisasi";

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-surface" />
    );
  }

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      {/* Avatar button — guest icon or user initials */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative h-8 w-8 overflow-hidden rounded-full border-2 border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_#8B5CF666] ${
          !isLoggedIn ? "bg-surface" : ""
        }`}
        aria-label="Profil"
      >
        {isLoggedIn ? (
          <div className="flex h-full w-full items-center justify-center bg-primary text-xs font-bold text-white">
            {initials}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <User className="h-4 w-4" />
          </div>
        )}
        {/* Sync dot indicator */}
        {isLoggedIn && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${dotColor}`}
            style={
              sync.status === "syncing"
                ? { animation: "syncSpin 2s linear infinite" }
                : undefined
            }
          />
        )}
      </button>

      {/* Popup */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-64 animate-fade-scale rounded-2xl border border-white/10 bg-surface/95 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-200 ease-out">
            {/* ── TOP: Login or Profile Info ── */}
            {isLoggedIn ? (
              <div className="mb-3 flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {user?.name ?? "Pengguna"}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setOpen(false); login(); }}
                className="mb-3 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-surface/65 px-4 py-3 text-sm font-semibold text-text-primary backdrop-blur-xl transition-all duration-200 hover:shadow-[0_0_24px_#8B5CF666]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Google
              </button>
            )}

            {/* Sync status */}
            {isLoggedIn && (
              <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
                {sync.status === "offline" ? (
                  <CloudOff className="h-3.5 w-3.5 text-[#FBBF24]" />
                ) : sync.status === "syncing" ? (
                  <Cloud className="h-3.5 w-3.5 animate-pulse text-[#22D3EE]" />
                ) : (
                  <Cloud className="h-3.5 w-3.5 text-[#34D399]" />
                )}
                <span className="font-mono">{syncLabel}</span>
              </div>
            )}

            {/* ── MOBILE ONLY: Theme Toggle ── */}
            <div className="lg:hidden mb-3">
              <button
                onClick={() => { setOpen(false); toggleTheme(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <Sun className="h-4 w-4 light-only" />
                <Moon className="h-4 w-4 dark-only" />
                <span className="light-only">Mode Gelap</span>
                <span className="dark-only">Mode Terang</span>
              </button>
            </div>

            {/* ── BOTTOM: Settings + Logout ── */}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              <Settings className="h-4 w-4" />
              Pengaturan Sinkronisasi
            </Link>
            {isLoggedIn && (
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
