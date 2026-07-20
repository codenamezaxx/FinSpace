"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Cloud, RefreshCw, LogOut, Info } from "lucide-react";
import Link from "next/link";
import { useCloudAuth } from "@/hooks/useCloudAuth";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { db } from "@/lib/db";

interface SyncLogEntry {
  time: string;
  phase: string;
}

export default function SettingsPage() {
  const { user, isLoggedIn, isLoading, login, logout } = useCloudAuth();
  const sync = useSyncStatus();
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const prevPhase = useRef("__initial__");
  const [syncing, setSyncing] = useState(false);

  // ── Sync history: track phase transitions ──
  useEffect(() => {
    if (sync.phase !== prevPhase.current) {
      const now = new Date();
      const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const label =
        sync.phase === "pushing" || sync.phase === "pulling"
          ? "Menyinkronkan..."
          : sync.phase === "error"
            ? "Gagal sinkron"
            : sync.phase === "completed"
              ? "Tersinkronisasi"
              : sync.phase;
      setSyncLog((prev) => [{ time, phase: label }, ...prev].slice(0, 20));
      prevPhase.current = sync.phase;
    }
  }, [sync.phase]);

  // ── Force sync ──
  const forceSync = useCallback(async () => {
    setSyncing(true);
    try {
      await db.cloud.sync();
    } catch {
      const now = new Date();
      const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setSyncLog((prev) => [{ time, phase: "Gagal sinkron" }, ...prev].slice(0, 20));
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Progress bar ──
  const progressPercent = sync.progress != null ? Math.round(sync.progress * 100) : null;
  const isSyncing = sync.status === "syncing" || syncing;
  const syncDisabled = !isLoggedIn && !isLoading;

  const statusColor =
    syncDisabled
      ? "bg-text-muted"
      : sync.status === "syncing"
        ? "bg-primary"
        : sync.status === "offline"
          ? "bg-warning"
          : "bg-success";

  const statusLabel =
    syncDisabled
      ? "Sinkronisasi nonaktif"
      : sync.status === "syncing"
        ? "Menyinkronkan..."
        : sync.status === "offline"
          ? "Offline"
          : "Tersinkronisasi";

  return (
    <div className="mx-auto px-4 py-8">
      {/* ── Back button ── */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-text-primary">Pengaturan</h1>
      <p className="mb-8 text-sm text-text-muted">
        Kelola sinkronisasi cloud dan akun Anda
      </p>

      {/* ── Sync status card ── */}
      <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-primary">
          <Cloud className="h-5 w-5 text-primary" />
          Sinkronisasi Cloud
        </h2>

        {/* Status indikator */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium text-text-primary">{statusLabel}</span>
          {isSyncing && <RefreshCw className="ml-1 h-3.5 w-3.5 animate-spin text-primary" />}
        </div>

        {/* Progress bar */}
        {progressPercent != null && (
          <div className="mb-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-text-muted font-mono">{progressPercent}%</p>
          </div>
        )}

        {/* Akun info */}
        {isLoggedIn && user && (
          <div className="mb-4 rounded-xl bg-surface-alt p-3">
            <p className="text-xs text-text-muted">Masuk sebagai</p>
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-muted font-mono">{user.email}</p>
          </div>
        )}
        {!isLoggedIn && !isLoading && (
          <div className="mb-4 rounded-xl bg-surface-alt p-3">
            <p className="text-xs text-text-muted">Belum masuk</p>
            <p className="text-sm text-text-muted">Data akan tersinkronisasi setelah masuk dengan Google</p>
          </div>
        )}
        {isLoading && (
          <div className="mb-4 h-16 animate-pulse rounded-xl bg-surface-alt" />
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={forceSync}
            disabled={isSyncing || syncDisabled}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Menyinkronkan..." : syncDisabled ? "Masuk untuk sinkron" : "Sinkronkan Sekarang"}
          </button>

          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-all duration-200 hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          ) : (
            <button
              onClick={login}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-surface-alt disabled:opacity-50"
            >
              Masuk dengan Google
            </button>
          )}
        </div>
      </div>

      {/* ── Sync history ── */}
      <div className="mb-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
          <RefreshCw className="h-5 w-5 text-primary" />
          Riwayat Sinkronisasi
        </h2>

        {syncLog.length === 0 ? (
          <p className="text-sm text-text-muted">
            Belum ada aktivitas sinkronisasi di sesi ini.
          </p>
        ) : (
          <div className="space-y-1">
            {syncLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm">
                <span className="w-16 shrink-0 text-xs text-text-muted font-mono">
                  {entry.time}
                </span>
                <span
                  className={`font-mono text-xs ${
                    entry.phase === "Tersinkronisasi"
                      ? "text-success"
                      : entry.phase === "Gagal sinkron"
                        ? "text-danger"
                        : entry.phase === "Menyinkronkan..."
                          ? "text-primary"
                          : "text-text-muted"
                  }`}
                >
                  {entry.phase}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Info footer ── */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
          <Info className="h-5 w-5 text-primary" />
          Informasi
        </h2>
        <div className="space-y-2 text-xs text-text-muted">
          <p>
            Data Anda disimpan secara lokal di perangkat ini dan disinkronkan secara
            otomatis ke cloud saat Anda masuk. Sinkronisasi berjalan di latar belakang
            tanpa mengganggu aktivitas Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
