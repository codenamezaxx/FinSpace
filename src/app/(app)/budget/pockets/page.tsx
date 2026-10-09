"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { usePockets } from "@/hooks/usePockets";
import { PocketGrid } from "@/components/budget/PocketGrid";
import { PocketFormModal } from "@/components/budget/PocketFormModal";
import type { Pocket } from "@/lib/pocket";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { TransferModal } from "@/components/budget/TransferModal";

export default function BudgetPocketsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const {
    pockets, balances,
    addPocket, renamePocket, deletePocket,
    transferBetweenPockets,
  } = usePockets();

  const [showPocketForm, setShowPocketForm] = useState(false);
  const [editingPocket, setEditingPocket] = useState<Pocket | null>(null);
  const [pocketToDelete, setPocketToDelete] = useState<Pocket | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState<Pocket | null>(null);

  return (
    <div className="space-y-6 lg:px-4">
      <Link
        href="/budget"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("settings.back")}
      </Link>

      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold text-text-primary">
          {t("budget.pockets_title")}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {t("budget.manage_pockets")}
        </p>
      </div>

      <div className="glass flex items-center justify-between gap-3 rounded-2xl p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted">
            {t("budget.total_balance")}
          </p>
          <p className="mt-1 truncate font-mono text-2xl font-bold text-text-primary">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(
              pockets.reduce((s, p) => s + (balances[p.id] ?? 0), 0)
            )}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold text-primary">
          {t("budget.pocket_count", { count: pockets.length })}
        </span>
      </div>

      <PocketGrid
        pockets={pockets}
        balances={balances}
        selectedId={null}
        onSelect={(id) => {
          if (id) router.push(`/budget/transactions?pocket=${id}`);
        }}
        onAdd={() => setShowPocketForm(true)}
        onRename={(p) => setEditingPocket(p)}
        onDelete={(p) => setPocketToDelete(p)}
        onTransfer={(p) => {
          if (p) setTransferFrom(p); else setShowTransfer(true);
        }}
      />

      <PocketFormModal
        isOpen={showPocketForm}
        onClose={() => setShowPocketForm(false)}
        onSave={async (name, category, initialBalance) => {
          const pocketId = await addPocket(name, category);
          if (initialBalance && initialBalance > 0) {
            const { db } = await import("@/lib/db");
            await db.transactions.add({
              id: `trn_${Date.now()}`,
              type: "income",
              amount: initialBalance,
              category: "Lainnya",
              merchant: `Saldo awal ${name}`,
              payment_method: "Lainnya",
              pocketId,
              timestamp: Date.now(),
            });
          }
        }}
        title={t("budget.add_pocket")}
      />
      <PocketFormModal
        isOpen={!!editingPocket}
        onClose={() => setEditingPocket(null)}
        onSave={(name) => { if (editingPocket) renamePocket(editingPocket.id, name); }}
        initialName={editingPocket?.name}
        title={t("budget.rename_pocket")}
      />

      {/* Delete Pocket Confirmation */}
      <ResponsiveModal
        isOpen={!!pocketToDelete}
        onClose={() => setPocketToDelete(null)}
        title={t("budget.delete_pocket_title")}
      >
        <p className="text-sm text-text-secondary mb-4">
          {t("budget.delete_pocket_message", { name: pocketToDelete?.name ?? "" })}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPocketToDelete(null)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors"
          >
            {t("common.cancel")}
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
            {t("common.delete")}
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
