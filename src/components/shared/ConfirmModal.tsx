"use client";

import { AlertTriangle } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";
import { useLanguage } from "@/lib/i18n";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useLanguage();
  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="h-7 w-7 text-danger" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>

        {/* Message */}
        <p className="text-sm leading-relaxed text-text-secondary">{message}</p>

        {/* Actions */}
        <div className="flex w-full gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-alt disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-danger hover:bg-danger/90"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {isLoading ? t("common.loading") : (confirmLabel ?? t("confirm.confirm"))}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
