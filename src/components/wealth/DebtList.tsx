"use client";

import { Trash2, HandCoins, AlertTriangle } from "lucide-react";
import type { DebtEntry } from "@/lib/netWorth";
import { formatCurrency } from "@/lib/netWorth";
import { calcInstallment, remainingAmount } from "@/lib/debtUtils";
import type { InstallmentResult } from "@/lib/debtUtils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface DebtListProps {
  debts: DebtEntry[];
  onPay: (debt: DebtEntry) => void;
  onDelete: (id: string) => void;
}

export function DebtList({ debts, onPay, onDelete }: DebtListProps) {
  const { t, lang } = useLanguage();

  if (debts.length === 0) {
    return (
      <p className="font-mono text-sm italic text-text-secondary/70">
        {t("debt.empty_hint")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {debts.map((debt) => {
        const remaining = remainingAmount(debt);
        const progress = debt.totalAmount > 0
          ? Math.round((debt.paidAmount / debt.totalAmount) * 100)
          : 0;
        const installment = calcInstallment(remaining, debt.dueDate, debt.interestRate);

        return (
          <DebtItem
            key={debt.id}
            debt={debt}
            remaining={remaining}
            progress={progress}
            installment={installment}
            onPay={() => onPay(debt)}
            onDelete={() => onDelete(debt.id)}
            t={t}
            lang={lang}
          />
        );
      })}
    </div>
  );
}

function DebtItem({
  debt,
  remaining,
  progress,
  installment,
  onPay,
  onDelete,
  t,
  lang,
}: {
  debt: DebtEntry;
  remaining: number;
  progress: number;
  installment: InstallmentResult;
  onPay: () => void;
  onDelete: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: string;
}) {
  const locale = lang === "id" ? "id-ID" : "en-US";
  let infoText = "";
  if (installment.overdue) {
    infoText = t("debt.overdue");
  } else if (installment.period === "bulan") {
    infoText = t("debt.installment_monthly", { amount: formatCurrency(installment.amount), count: installment.count });
  } else {
    infoText = t("debt.installment_weekly", { amount: formatCurrency(installment.amount), count: installment.count });
  }

  const interestInfo =
    installment.interestTotal != null && installment.interestTotal > 0
      ? t("debt.interest", { amount: formatCurrency(installment.interestTotal) })
      : null;

  return (
    <div
    onClick={onPay} 
    className="glass rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">{debt.name}</p>
          <p className={`mt-0.5 font-mono text-xs ${installment.overdue ? "text-danger" : "text-text-muted"}`}>
            {installment.overdue && <AlertTriangle className="mr-1 inline h-3 w-3" />}
            {infoText}
          </p>
          {interestInfo && (
            <p className="mt-0.5 font-mono text-[11px] text-accent">
              {interestInfo}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text-primary">
            {formatCurrency(remaining)}
          </span>
          <button
            type="button"
            onClick={onPay}
            disabled={remaining <= 0}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-sm font-medium text-primary transition-all duration-200 cursor-pointer hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HandCoins className="h-3.5 w-3.5" />
            {t("debt.pay")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-text-muted transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-text-muted">{progress}%</span>
      </div>

      {/* Due date */}
      <div className="mt-2 flex items-center justify-between">
        <p className="font-mono text-[11px] text-text-muted">
          {t("debt.due_date", {
            date: new Date(debt.dueDate).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })}
        </p>
        
      </div>
    </div>
  );
}
