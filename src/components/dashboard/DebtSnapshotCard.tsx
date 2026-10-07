"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, HandCoins } from "lucide-react";
import { formatCurrency } from "@/lib/netWorth";
import type { DebtEntry } from "@/lib/netWorth";
import { remainingAmount } from "@/lib/debtUtils";
import { useLanguage } from "@/lib/i18n";

interface DebtSnapshotCardProps {
  debts: DebtEntry[];
  viewAllHref?: string;
}

function formatDue(ts: number, lang: string): string {
  return new Date(ts).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DebtSnapshotCard({ debts, viewAllHref }: DebtSnapshotCardProps) {
  const { t, lang } = useLanguage();
  const top = [...debts]
    .map((d) => ({ debt: d, remaining: remainingAmount(d) }))
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 5);

  return (
    <div className="glass min-w-0 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <HandCoins className="h-4 w-4 shrink-0 text-text-muted" />
        <h2 className="truncate text-sm font-semibold text-text-primary">
          {t("dashboard.top_debts")}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {t("wealth.view_all")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {top.length === 0 ? (
        <p className="py-4 text-center text-sm italic text-text-secondary/70">
          {t("debt.empty_hint")}
        </p>
      ) : (
        <div className="space-y-2">
          {top.map(({ debt, remaining }) => {
            const overdue = debt.dueDate < Date.now() && remaining > 0;
            return (
              <div
                key={debt.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-alt/40 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {debt.name}
                  </p>
                  <p
                    className={`mt-0.5 flex items-center gap-1 font-mono text-[11px] ${
                      overdue ? "font-semibold text-danger" : "text-text-muted"
                    }`}
                  >
                    {overdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                    {formatDue(debt.dueDate, lang)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold text-text-primary">
                  {formatCurrency(remaining)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
