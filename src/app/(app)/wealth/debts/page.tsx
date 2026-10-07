"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { useWealthData } from "@/hooks/useWealthData";
import { useTransactions } from "@/hooks/useTransactions";
import { DebtForm } from "@/components/wealth/DebtForm";
import { PayDebtModal } from "@/components/wealth/PayDebtModal";
import { DebtList } from "@/components/wealth/DebtList";
import { PayoffSimulator } from "@/components/wealth/PayoffSimulator";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { calculateNetWorth, formatCurrency } from "@/lib/netWorth";
import type { DebtEntry } from "@/lib/netWorth";
import { usePockets } from "@/hooks/usePockets";
import { useLanguage } from "@/lib/i18n";

export default function WealthDebtsPage() {
  const { t } = useLanguage();
  const { debts, assets, liabilities } = useWealthData();
  const { addTransaction } = useTransactions();
  const { totalBalance: pocketTotalBalance } = usePockets();

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtEntry | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<DebtEntry | null>(null);
  const [editingDebt, setEditingDebt] = useState<DebtEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalDebts = calculateNetWorth(
    assets,
    liabilities,
    pocketTotalBalance,
    debts
  ).totalDebts;

  const handleAddDebt = useCallback(async (debt: DebtEntry) => {
    await db.debts.put(debt);
  }, []);

  const handlePayDebt = useCallback(
    async (debtId: string, amount: number, debtName: string) => {
      const debt = await db.debts.get(debtId);
      if (debt) {
        await db.debts.put({
          ...debt,
          paidAmount: (debt.paidAmount || 0) + amount,
        });
      }
      addTransaction({
        amount,
        type: "expense",
        category: "Cicilan",
        merchant: debtName,
        payment_method: "Tunai",
      });
    },
    [addTransaction]
  );

  const handleConfirmDeleteDebt = async () => {
    if (!debtToDelete) return;
    setDeleting(true);
    try {
      await db.debts.delete(debtToDelete.id);
      setDebtToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 lg:px-4">
      <Link
        href="/wealth"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("settings.back")}
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-text-primary">
            {t("wealth.debts_page_title")}
          </h1>
          <p className="mt-2 font-mono text-xs text-text-muted">
            {debts.length} · {formatCurrency(totalDebts)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDebtForm(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary/10 px-5 py-3 text-sm font-semibold text-primary shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("wealth.add_debt")}
        </button>
      </div>

      <DebtList
        debts={debts}
        onPay={(debt) => setPayingDebt(debt)}
        onEdit={(debt) => setEditingDebt(debt)}
        onDelete={(id) => {
          const debt = debts.find((d) => d.id === id);
          if (debt) setDebtToDelete(debt);
        }}
      />

      <PayoffSimulator debts={debts} />

      <DebtForm
        isOpen={showDebtForm || !!editingDebt}
        onClose={() => {
          setShowDebtForm(false);
          setEditingDebt(null);
        }}
        onSave={handleAddDebt}
        initialDebt={editingDebt ?? undefined}
      />
      <PayDebtModal
        isOpen={!!payingDebt}
        debt={payingDebt}
        onClose={() => setPayingDebt(null)}
        onPay={handlePayDebt}
      />
      <ConfirmModal
        isOpen={!!debtToDelete}
        onClose={() => setDebtToDelete(null)}
        onConfirm={handleConfirmDeleteDebt}
        title={t("confirm.delete_debt")}
        message={t("confirm.delete_message", { item: debtToDelete?.name ?? "" })}
        confirmLabel={t("confirm.confirm")}
        isLoading={deleting}
      />
    </div>
  );
}
