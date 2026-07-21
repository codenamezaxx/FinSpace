"use client";

import { type FC, useEffect, useCallback } from "react";
import { X, Camera, RefreshCw, Loader2 } from "lucide-react";
import TransactionPreview from "./TransactionPreview";
import type { PocketInfo } from "@/hooks/useFinnyChat";

/* ─── Local types ─── */

interface ScanResult {
  action: string;
  message: string;
  data?: Record<string, unknown>;
  confidence?: string;
}

interface ScanResultModalProps {
  isOpen: boolean;
  imageDataUrl: string | null;
  result: ScanResult | null;
  isLoading: boolean;
  error: string | null;
  onSave: (action: string, data: Record<string, unknown>) => void;
  onClose: () => void;
  onRetry: () => void;
  pockets?: PocketInfo[];
}

/* ─── Component ─── */

const ScanResultModal: FC<ScanResultModalProps> = ({
  isOpen,
  imageDataUrl,
  result,
  isLoading,
  error,
  onSave,
  onClose,
  onRetry,
  pockets,
}) => {
  /* Close on Escape key */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* ── Closed state ── */
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content panel */}
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text-primary">
            Hasil Scan
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-alt transition-colors text-text-secondary"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Image preview */}
          {imageDataUrl && (
            <img
              src={imageDataUrl}
              alt="Preview struk"
              className="rounded-xl bg-surface-alt border border-border w-full h-48 object-contain"
            />
          )}

          {/* ── Loading state ── */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Memproses struk...</p>
            </div>
          )}

          {/* ── Error state ── */}
          {!isLoading && error && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-danger text-center">{error}</p>
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}

          {/* ── Result with data ── */}
          {!isLoading && !error && result?.data && (
            <>
              <p className="text-sm text-text-secondary">{result.message}</p>
              <TransactionPreview
                action={result.action}
                data={result.data}
                pockets={pockets}
                onSave={onSave}
                onCancel={onClose}
              />
            </>
          )}

          {/* ── Result without data (chat / unclear image) ── */}
          {!isLoading && !error && result && !result.data && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Camera className="w-10 h-10 text-text-muted" />
              <p className="text-sm text-text-secondary text-center">
                {result.message}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanResultModal;
