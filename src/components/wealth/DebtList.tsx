"use client";

import {
  Trash2,
  HandCoins,
  AlertTriangle,
  Pencil,
  Clock,
  Receipt,
  Check,
  Plus,
} from "lucide-react";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import type { DebtEntry } from "@/lib/netWorth";
import { formatCurrency } from "@/lib/netWorth";
import { calcInstallment, remainingAmount } from "@/lib/debtUtils";
import type { InstallmentResult } from "@/lib/debtUtils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface DebtListProps {
  debts: DebtEntry[];
  onPay?: (debt: DebtEntry) => void;
  onDelete?: (id: string) => void;
  onEdit?: (debt: DebtEntry) => void;
  onAdd?: () => void;
}

export function DebtList({ debts, onPay, onDelete, onEdit, onAdd }: DebtListProps) {
  const { t, lang } = useLanguage();
  const { page, totalPages, pageSize, setPageSize, next, prev } = usePagination(
    debts.length,
    15,
    debts.length
  );
  const paged = debts.slice((page - 1) * pageSize, page * pageSize);

  if (debts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <HandCoins className="mx-auto h-8 w-8 text-text-muted" />
        <p className="mt-2 font-mono text-sm italic text-text-secondary/70">
          {t("debt.empty_hint")}
        </p>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            {t("wealth.add_debt")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {paged.map((debt) => {
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
            onPay={onPay ? () => onPay(debt) : undefined}
            onDelete={onDelete ? () => onDelete(debt.id) : undefined}
            onEdit={onEdit ? () => onEdit(debt) : undefined}
            t={t}
            lang={lang}
          />
        );
      })}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrev={prev}
        onNext={next}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
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
  onEdit,
  t,
  lang,
}: {
  debt: DebtEntry;
  remaining: number;
  progress: number;
  installment: InstallmentResult;
  onPay?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: string;
}) {
  const locale = lang === "id" ? "id-ID" : "en-US";
  const paidOff = remaining <= 0;
  const daysLeft = Math.ceil((debt.dueDate - Date.now()) / 86400000);
  const dueSoon = !paidOff && !installment.overdue && daysLeft <= 30;
  const dueDateText = new Date(debt.dueDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let infoText = "";
  if (!paidOff) {
    if (installment.overdue) {
      infoText = t("debt.due_date", { date: dueDateText });
    } else if (installment.period === "bulan") {
      infoText = t("debt.installment_monthly", { amount: formatCurrency(installment.amount), count: installment.count });
    } else {
      infoText = t("debt.installment_weekly", { amount: formatCurrency(installment.amount), count: installment.count });
    }
  }

  const interestInfo =
    !paidOff &&
    installment.interestTotal != null &&
    installment.interestTotal > 0
      ? t("debt.interest", { amount: formatCurrency(installment.interestTotal) })
      : null;

  const statusTone = paidOff
    ? "bg-success/10 text-success"
    : installment.overdue
      ? "bg-danger/10 text-danger"
      : dueSoon
        ? "bg-warning/10 text-warning"
        : "bg-surface-alt text-text-muted";

  return (
    <div className="glass rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusTone}`}>
            {paidOff ? (
              <Check className="h-4 w-4" />
            ) : installment.overdue ? (
              <AlertTriangle className="h-4 w-4" />
            ) : dueSoon ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Receipt className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-medium text-text-primary">{debt.name}</p>
              {paidOff ? (
                <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-success">
                  {t("debt.paid_off")}
                </span>
              ) : installment.overdue ? (
                <span className="rounded-full bg-danger/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-danger">
                  {t("debt.overdue")}
                </span>
              ) : dueSoon ? (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-warning">
                  {t("debt.due_soon", { days: Math.max(daysLeft, 0) })}
                </span>
              ) : null}
            </div>
            {!paidOff && (
              <p className={`mt-0.5 font-mono text-xs ${installment.overdue ? "text-danger" : "text-text-muted"}`}>
                {infoText}
              </p>
            )}
            {interestInfo && (
              <p className="mt-0.5 font-mono text-[11px] text-accent">
                {interestInfo}
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold text-text-primary">
          {formatCurrency(remaining)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              paidOff ? "bg-success" : "bg-gradient-to-r from-primary to-accent-secondary"
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-text-muted">{progress}%</span>
      </div>

      {/* Due date + actions */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-text-muted">
          {t("debt.due_date", { date: dueDateText })}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {onPay && !paidOff && (
            <button
              type="button"
              onClick={onPay}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-on-primary shadow-md shadow-primary/25 transition-all duration-200 hover:bg-primary-hover active:scale-[0.98]"
            >
              <HandCoins className="h-3.5 w-3.5" />
              {t("debt.pay")}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-text-muted transition-colors hover:text-primary"
              aria-label={t("wealth.edit_debt")}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-text-muted transition-colors hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
