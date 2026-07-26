"use client";

import { ArrowDownUp, Eye, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { TransactionCard } from "./TransactionCard";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { TransactionEditModal } from "./TransactionEditModal";
import { ConfirmModal } from "./ConfirmModal";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebounce } from "@/hooks/useDebounce";
import type { Transaction } from "@/lib/db";
import type { Pocket } from "@/lib/pocket";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type SortField = "timestamp" | "amount";
type SortDir = "asc" | "desc";

interface TransactionListProps {
  pocketFilter?: string | null;
  pockets?: Pocket[];
  searchQuery?: string; // from global search
}

export function TransactionList({
  pocketFilter = null,
  pockets = [],
  searchQuery,
}: TransactionListProps) {
  const { t } = useLanguage();
  const { transactions, loading, deleteTransaction, updateTransaction } =
    useTransactions();
  const [search, setSearch] = useState("");
  // Sync external searchQuery prop
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== search) {
      setSearch(searchQuery);
    }
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  const debouncedSearch = useDebounce(search, 300);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [hideTransfers, setHideTransfers] = useState(false);

  // Detail / Edit / Delete modal state
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (pocketFilter) {
      result = result.filter((t) => t.pocketId === pocketFilter);
    }

    if (hideTransfers) {
      result = result.filter((t) => !t.transferId);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [
    transactions,
    debouncedSearch,
    sortField,
    sortDir,
    typeFilter,
    pocketFilter,
    hideTransfers,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTx.id);
      setDeleteTx(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-2xl bg-surface/50"
          />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-text-muted">
        <Search className="h-8 w-8" />
        <p className="text-sm">{t("search.no_results")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setTypeFilter(filterType)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                typeFilter === filterType
                  ? "bg-primary text-white"
                  : "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
              }`}
            >
              {filterType === "all"
                ? t("common.all")
                : filterType === "income"
                  ? t("transaction.income")
                  : t("transaction.expense")}
            </button>
          ))}
          <button
            onClick={() => setHideTransfers(!hideTransfers)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              hideTransfers
                ? "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
                : "bg-primary/10 text-primary"
            }`}
          >
            {hideTransfers ? t("transaction.show_transfers") : t("transaction.hide_transfers")}
          </button>
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="space-y-3 md:hidden">
        {filtered.map((t) => (
          <TransactionCard
            key={t.id}
            transaction={t}
            onShowDetail={setDetailTx}
          />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto glass rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">
                {t("transaction.type")}
              </th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">
                {t("transaction.merchant")}
              </th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">
                {t("transaction.category")}
              </th>
              <th
                className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary"
                onClick={() => toggleSort("amount")}
              >
                <span className="inline-flex items-center gap-1">
                  {t("transaction.amount")}
                  {sortField === "amount" && (
                    <ArrowDownUp className="h-3 w-3" />
                  )}
                </span>
              </th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">
                {t("transaction.pocket")}
              </th>
              <th
                className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary"
                onClick={() => toggleSort("timestamp")}
              >
                <span className="inline-flex items-center gap-1">
                  {t("transaction.date")}
                  {sortField === "timestamp" && (
                    <ArrowDownUp className="h-3 w-3" />
                  )}
                </span>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => setDetailTx(tx)}
                className="border-b border-border/50 last:border-0 hover:bg-surface-alt/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      tx.type === "expense"
                        ? "bg-danger/10 text-danger"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {tx.type === "expense" ? t("transaction.expense") : t("transaction.income")}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">
                  {tx.merchant}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {tx.category}
                </td>
                <td
                  className={`px-4 py-3 font-mono font-semibold ${
                    tx.type === "expense" ? "text-danger" : "text-success"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatAmount(tx.amount)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {pockets.find((p) => p.id === tx.pocketId)?.name ??
                    tx.payment_method}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(tx.timestamp)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailTx(tx);
                    }}
                    className="text-text-muted hover:text-primary transition-colors"
                    aria-label={t("transaction.detail_title")}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={!!detailTx}
        onClose={() => setDetailTx(null)}
        transaction={detailTx}
        onEdit={(tx) => setEditTx(tx)}
        onDelete={(tx) => setDeleteTx(tx)}
      />

      {/* Edit Modal */}
      <TransactionEditModal
        isOpen={!!editTx}
        onClose={() => setEditTx(null)}
        transaction={editTx}
        onSave={updateTransaction}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleConfirmDelete}
        title={t("confirm.delete_title")}
        message={t("confirm.delete_message", { item: `Transaksi "${deleteTx?.merchant}"` })}
        confirmLabel={t("confirm.confirm")}
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
