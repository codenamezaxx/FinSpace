"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { TransactionList } from "@/components/shared/TransactionList";
import { BudgetRing } from "@/components/budget/BudgetRing";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionModal } from "@/lib/transaction-modal-context";
import {
  calculateBudgetAllocation,
  checkBudgetStatus,
  CATEGORY_MAPPING,
} from "@/lib/budgetRules";
import { usePockets } from "@/hooks/usePockets";
import { PocketGrid } from "@/components/budget/PocketGrid";
import { PocketFormModal } from "@/components/budget/PocketFormModal";
import type { Pocket } from "@/lib/pocket";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { TransferModal } from "@/components/budget/TransferModal";

function BudgetPageInner() {
  const { openAddTransaction } = useTransactionModal();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const { transactions } = useTransactions({ startTime: startOfMonth });

  const {
    pockets, balances, totalBalance: pocketBalance,
    addPocket, renamePocket, deletePocket,
    pocketFilter, setPocketFilter,
    transferBetweenPockets,
  } = usePockets();

  const [showPocketForm, setShowPocketForm] = useState(false);
  const [editingPocket, setEditingPocket] = useState<Pocket | null>(null);
  const [pocketToDelete, setPocketToDelete] = useState<Pocket | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState<Pocket | null>(null);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || undefined;

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const allocation = useMemo(() => calculateBudgetAllocation(monthlyIncome), [monthlyIncome]);

  const spending = useMemo(() => {
    const monthlyExpenses = transactions.filter(
      (t) => t.type === "expense"
    );

    let needs = 0;
    let wants = 0;

    for (const tx of monthlyExpenses) {
      const bucket = CATEGORY_MAPPING[tx.category] || "wants";
      if (bucket === "needs") needs += tx.amount;
      else wants += tx.amount;
    }

    return { needs, wants };
  }, [transactions]);

  const needsStatus = checkBudgetStatus(spending.needs, allocation.needs);
  const wantsStatus = checkBudgetStatus(spending.wants, allocation.wants);
  const totalSaved = monthlyIncome - spending.needs - spending.wants;
  const savingsStatus = checkBudgetStatus(
    Math.max(0, allocation.savings - totalSaved),
    allocation.savings
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Anggaran &amp; Arus Kas
          </h1>
          <p className="text-sm text-text-muted">
            Pendapatan bulanan:{" "}
            <span className="font-mono font-semibold text-success">
              {formatCurrency(monthlyIncome)}
            </span>
          </p>
        </div>
        <button
          onClick={() => openAddTransaction()}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Transaksi
        </button>
      </div>

      {/* 50/30/20 Budget Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Needs (50%) */}
        <div className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={needsStatus.percentage}
            label="Kebutuhan (50%)"
            sublabel={`Terpakai ${formatCurrency(spending.needs)}`}
            remaining={
              needsStatus.isOverBudget
                ? `Lebih ${formatCurrency(Math.abs(needsStatus.remaining))}`
                : `${formatCurrency(needsStatus.remaining)} tersisa`
            }
            isOverBudget={needsStatus.isOverBudget}
          />
        </div>

        {/* Wants (30%) */}
        <div className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={wantsStatus.percentage}
            label="Keinginan (30%)"
            sublabel={`Terpakai ${formatCurrency(spending.wants)}`}
            remaining={
              wantsStatus.isOverBudget
                ? `Lebih ${formatCurrency(Math.abs(wantsStatus.remaining))}`
                : `${formatCurrency(wantsStatus.remaining)} tersisa`
            }
            isOverBudget={wantsStatus.isOverBudget}
          />
        </div>

        {/* Savings (20%) */}
        <div className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
          <BudgetRing
            percentage={savingsStatus.percentage}
            label="Tabungan (20%)"
            sublabel={`Tersimpan ${formatCurrency(totalSaved)}`}
            remaining={
              totalSaved >= allocation.savings
                ? `${formatCurrency(totalSaved - allocation.savings)} surplus`
                : `${formatCurrency(Math.max(0, allocation.savings - totalSaved))} menuju target`
            }
            isOverBudget={totalSaved < allocation.savings}
          />
        </div>
      </div>

      {/* Pocket Cards */}
      <PocketGrid
        pockets={pockets}
        balances={balances}
        selectedId={pocketFilter}
        onSelect={setPocketFilter}
        onAdd={() => setShowPocketForm(true)}
        onRename={(p) => setEditingPocket(p)}
        onDelete={(p) => setPocketToDelete(p)}
        onTransfer={(p) => {
          if (p) setTransferFrom(p); else setShowTransfer(true);
        }}
      />

      {/* Transaction List */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-primary">
          Transaksi Terbaru
        </h2>
        <TransactionList pocketFilter={pocketFilter} pockets={pockets} searchQuery={searchQuery} />
      </div>


      <PocketFormModal
        isOpen={showPocketForm}
        onClose={() => setShowPocketForm(false)}
        onSave={(name, category) => addPocket(name, category)}
        title="Tambah Kantong"
      />
      <PocketFormModal
        isOpen={!!editingPocket}
        onClose={() => setEditingPocket(null)}
        onSave={(name) => { if (editingPocket) renamePocket(editingPocket.id, name); }}
        initialName={editingPocket?.name}
        title="Ganti Nama Kantong"
      />

      {/* Delete Pocket Confirmation */}
      <ResponsiveModal
        isOpen={!!pocketToDelete}
        onClose={() => setPocketToDelete(null)}
        title="Hapus Kantong"
      >
        <p className="text-sm text-text-secondary mb-4">
          Hapus kantong &ldquo;{pocketToDelete?.name}&rdquo;? Transaksi yang ada di kantong ini tidak akan dihapus.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPocketToDelete(null)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              if (pocketToDelete) {
                deletePocket(pocketToDelete.id);
                setPocketToDelete(null);
              }
            }}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 transition-colors"
          >
            Hapus
          </button>
        </div>
      </ResponsiveModal>

      <TransferModal
        isOpen={showTransfer || !!transferFrom}
        onClose={() => { setShowTransfer(false); setTransferFrom(null); }}
        pockets={pockets}
        balances={balances}
        preSelectedFrom={transferFrom?.id}
        onTransfer={transferBetweenPockets}
      />
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={null}>
      <BudgetPageInner />
    </Suspense>
  );
}

