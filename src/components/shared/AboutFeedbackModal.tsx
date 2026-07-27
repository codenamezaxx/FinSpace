"use client";

import { Mail, Bug } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";
import { useLanguage } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";

interface AboutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutFeedbackModal({ isOpen, onClose }: AboutFeedbackModalProps) {
  const { t } = useLanguage();

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={t("about.title")}>
      <div className="flex flex-col items-center gap-6">
        {/* ── App Identity ── */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/icons/icon-192x192.svg"
            alt="FinSpace"
            className="h-16 w-16"
          />
          <div className="text-center">
            <h3 className="text-lg font-bold text-text-primary">FinSpace</h3>
            <p className="text-xs text-text-muted font-mono">
              {t("about.version")} {APP_VERSION}
            </p>
          </div>
          <p className="text-sm text-text-secondary text-center max-w-xs">
            {t("about.description")}
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="w-full border-t border-border" />

        {/* ── Feedback ── */}
        <div className="w-full space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">
            {t("about.feedback")}
          </h4>

          <a
            href="mailto:zakky.ahmad@protonmail.com"
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <span>{t("about.email_developer")}</span>
          </a>

          <a
            href="https://github.com/codenamezaxx/Finspace/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
          >
            <Bug className="h-4 w-4 shrink-0 text-primary" />
            <span>{t("about.report_issue")}</span>
          </a>
        </div>
      </div>
    </ResponsiveModal>
  );
}
