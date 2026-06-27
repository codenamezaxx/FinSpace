"use client";

import { ArrowDownUp, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { TransactionCard } from "./TransactionCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebounce } from "@/hooks/useDebounce";
import type { Transaction } from "@/lib/db";

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

function SyncDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        status === "synced"
          ? "bg-success"
          : status === "pending"
          ? "bg-warning"
          : "bg-text-muted"
      }`}
      title={status}
    />
  );
}

export function TransactionList() {
  const { transactions, loading, deleteTransaction } = useTransactions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (debouncedSearch.trim()) {
      const q = search.toLowerCase();
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
  }, [transactions, debouncedSearch, sortField, sortDir, typeFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
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
        <p className="text-sm">Tidak ada transaksi</p>
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
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                typeFilter === t
                  ? "bg-primary text-white"
                  : "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
              }`}
            >
              {t === "all" ? "Semua" : t === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="space-y-3 md:hidden">
        {filtered.map((t) => (
          <TransactionCard key={t.id} transaction={t} />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto glass rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">Tipe</th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">Merchant</th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">Kategori</th>
              <th
                className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary"
                onClick={() => toggleSort("amount")}
              >
                <span className="inline-flex items-center gap-1">
                  Jumlah
                  {sortField === "amount" && (
                    <ArrowDownUp className="h-3 w-3" />
                  )}
                </span>
              </th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">Pembayaran</th>
              <th
                className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary"
                onClick={() => toggleSort("timestamp")}
              >
                <span className="inline-flex items-center gap-1">
                  Tanggal
                  {sortField === "timestamp" && (
                    <ArrowDownUp className="h-3 w-3" />
                  )}
                </span>
              </th>
              <th className="px-4 py-3 text-xs font-mono font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/50 last:border-0 hover:bg-surface-alt/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.type === "expense"
                        ? "bg-danger/10 text-danger"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {t.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">
                  {t.merchant}
                </td>
                <td className="px-4 py-3 text-text-secondary">{t.category}</td>
                <td
                  className={`px-4 py-3 font-mono font-semibold ${
                    t.type === "expense" ? "text-danger" : "text-success"
                  }`}
                >
                  {t.type === "expense" ? "-" : "+"}
                  {formatAmount(t.amount)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {t.payment_method}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(t.timestamp)}
                </td>
                <td className="px-4 py-3">
                  <SyncDot status={t.sync_status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-text-muted hover:text-danger transition-colors"
                    aria-label="Hapus transaksi"
                  >
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
