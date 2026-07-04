"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, Banknote, CreditCard, TrendingDown, Wrench } from "lucide-react";
import type { SearchResults, TransactionResult, AssetResult, LiabilityResult, DebtResult, ToolResult } from "@/hooks/useSearch";

interface SearchDropdownProps {
  query: string;
  results: SearchResults | null;
  loading: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}

const RECENT_KEY = "finspace_recent_searches";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecent(q: string) {
  try {
    const list = getRecent().filter((s) => s !== q);
    list.unshift(q);
    if (list.length > MAX_RECENT) list.pop();
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Silently fail — localStorage may be full or unavailable
  }
}

function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Silently fail
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type FlatItem =
  | { kind: "transaction"; data: TransactionResult }
  | { kind: "asset"; data: AssetResult }
  | { kind: "liability"; data: LiabilityResult }
  | { kind: "debt"; data: DebtResult }
  | { kind: "tool"; data: ToolResult };

export function SearchDropdown({ query, results, loading, onClose, onNavigate }: SearchDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecent);

  const flatItems = useMemo(() => {
    if (!results) return [];
    const items: FlatItem[] = [];
    results.transactions.forEach((t) => items.push({ kind: "transaction", data: t }));
    results.assets.forEach((a) => items.push({ kind: "asset", data: a }));
    results.liabilities.forEach((l) => items.push({ kind: "liability", data: l }));
    results.debts.forEach((d) => items.push({ kind: "debt", data: d }));
    results.tools.forEach((t) => items.push({ kind: "tool", data: t }));
    return items;
  }, [results]);

  // Fix 4: Build Map for O(1) lookup by "kind:id" key
  const idxMap = useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, idx) => {
      map.set(`${item.kind}:${item.data.id}`, idx);
    });
    return map;
  }, [flatItems]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  const hasQuery = query.trim().length >= 2;
  const hasResults = results !== null;
  const showLoading = loading && hasQuery && !hasResults;
  const showRecent = !hasQuery && recentSearches.length > 0;
  const showResults = hasResults;
  const dropdownVisible = showRecent || showResults || showLoading;

  const totalResults = results
    ? results.transactions.length +
      results.assets.length +
      results.liabilities.length +
      results.debts.length +
      results.tools.length
    : 0;

  const navigate = useCallback(
    (url: string, recentQuery?: string) => {
      if (recentQuery) addRecent(recentQuery);
      else if (query.trim().length >= 2) addRecent(query.trim());
      onClose();
      onNavigate?.();
      router.push(url);
    },
    [query, router, onClose, onNavigate]
  );

  const getUrl = useCallback((item: FlatItem): string => {
    switch (item.kind) {
      case "transaction":
        return `/budget?q=${encodeURIComponent(item.data.merchant)}`;
      case "asset":
      case "liability":
      case "debt":
        return "/wealth";
      case "tool":
        return "/tools";
    }
  }, []);

  // Fix 1: Shared keyboard handler (works with both React.SyntheticEvent and native KeyboardEvent)
  const handleKeyboardNav = useCallback(
    (e: { key: string; preventDefault: () => void }) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
        return;
      }
      if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < flatItems.length) {
        e.preventDefault();
        navigate(getUrl(flatItems[highlightedIndex]));
      }
    },
    [flatItems, highlightedIndex, navigate, getUrl, onClose]
  );

  // Local handler for events bubbling from within the dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => handleKeyboardNav(e),
    [handleKeyboardNav]
  );

  // Fix 1: Global keydown listener — captures events from the search input (where focus lives)
  useEffect(() => {
    if (!dropdownVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip events that originated within the dropdown — those are handled by the local onKeyDown
      if (dropdownRef.current?.contains(e.target as Node)) return;
      handleKeyboardNav(e);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dropdownVisible, handleKeyboardNav]);

  // Click outside handler — closes dropdown when clicking outside
  // Stop propagation so clicks inside the dropdown never reach this handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        const el = e.target as HTMLElement;
        if (el.closest('input[type="search"]')) return;
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Fix 2: Loading skeleton
  if (showLoading) {
    return (
      <div
        ref={dropdownRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
      >
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-surface-alt" />
              <div className="h-4 flex-1 animate-pulse rounded bg-surface-alt" />
              <div className="h-4 w-20 animate-pulse rounded bg-surface-alt" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!showRecent && !showResults) return null;

  // Fix 3: Compute active descendant id for aria-activedescendant
  const highlightedItem =
    highlightedIndex >= 0 && highlightedIndex < flatItems.length
      ? flatItems[highlightedIndex]
      : null;
  const activeDescendantId = highlightedItem
    ? `search-option-${highlightedItem.kind}-${highlightedItem.data.id}`
    : undefined;

  return (
    <div
      ref={dropdownRef}
      tabIndex={-1}
      role="listbox"
      aria-activedescendant={activeDescendantId}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40"
    >
      {showResults && totalResults === 0 && (
        <div className="flex items-center gap-3 px-4 py-6 text-sm text-text-muted">
          <Search className="h-4 w-4 shrink-0" />
          <span>Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;</span>
        </div>
      )}

      {showRecent && (
        <>
          <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <span>Pencarian Terakhir</span>
            <button
              type="button"
              onClick={() => { clearRecent(); setRecentSearches([]); }}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Hapus riwayat
            </button>
          </div>
          {recentSearches.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => navigate(`/budget?q=${encodeURIComponent(q)}`, q)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-alt transition-colors text-left"
            >
              <Clock className="h-4 w-4 shrink-0 text-text-muted" />
              <span>{q}</span>
            </button>
          ))}
        </>
      )}

      {showResults && totalResults > 0 && (
        <div className="py-2">
          {results!.transactions.length > 0 && (
            <>
              <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Transaksi
              </p>
              {results!.transactions.map((tx) => {
                const flatIdx = idxMap.get("transaction:" + tx.id) ?? -1;
                const optionId = `search-option-transaction-${tx.id}`;
                return (
                  <button
                    id={optionId}
                    key={tx.id}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === flatIdx}
                    onClick={() => navigate(getUrl({ kind: "transaction", data: tx }))}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      highlightedIndex === flatIdx
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-surface-alt"
                    }`}
                  >
                    <span className={`shrink-0 font-mono text-xs font-semibold ${tx.type === "income" ? "text-success" : "text-danger"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatAmount(tx.amount)}
                    </span>
                    <span className="flex-1 truncate text-text-primary">{tx.merchant}</span>
                    <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-text-muted">
                      {tx.category}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {results!.assets.length > 0 && (
            <>
              <p className="px-4 py-1.5 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Aset
              </p>
              {results!.assets.map((a) => {
                const flatIdx = idxMap.get("asset:" + a.id) ?? -1;
                const optionId = `search-option-asset-${a.id}`;
                return (
                  <button
                    id={optionId}
                    key={a.id}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === flatIdx}
                    onClick={() => navigate(getUrl({ kind: "asset", data: a }))}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      highlightedIndex === flatIdx
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-surface-alt"
                    }`}
                  >
                    <Banknote className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 truncate text-text-primary">{a.name}</span>
                    <span className="shrink-0 font-mono text-xs text-text-secondary">{formatAmount(a.amount)}</span>
                  </button>
                );
              })}
            </>
          )}

          {results!.liabilities.length > 0 && (
            <>
              <p className="px-4 py-1.5 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Liabilitas
              </p>
              {results!.liabilities.map((l) => {
                const flatIdx = idxMap.get("liability:" + l.id) ?? -1;
                const optionId = `search-option-liability-${l.id}`;
                return (
                  <button
                    id={optionId}
                    key={l.id}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === flatIdx}
                    onClick={() => navigate(getUrl({ kind: "liability", data: l }))}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      highlightedIndex === flatIdx
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-surface-alt"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-danger" />
                    <span className="flex-1 truncate text-text-primary">{l.name}</span>
                    <span className="shrink-0 font-mono text-xs text-text-secondary">{formatAmount(l.amount)}</span>
                  </button>
                );
              })}
            </>
          )}

          {results!.debts.length > 0 && (
            <>
              <p className="px-4 py-1.5 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Utang
              </p>
              {results!.debts.map((d) => {
                const flatIdx = idxMap.get("debt:" + d.id) ?? -1;
                const optionId = `search-option-debt-${d.id}`;
                return (
                  <button
                    id={optionId}
                    key={d.id}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === flatIdx}
                    onClick={() => navigate(getUrl({ kind: "debt", data: d }))}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      highlightedIndex === flatIdx
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-surface-alt"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4 shrink-0 text-warning" />
                    <span className="flex-1 truncate text-text-primary">{d.name}</span>
                    <span className="shrink-0 font-mono text-xs text-text-secondary">{formatAmount(d.totalAmount)}</span>
                  </button>
                );
              })}
            </>
          )}

          {results!.tools.length > 0 && (
            <>
              <p className="px-4 py-1.5 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Alat
              </p>
              {results!.tools.map((t) => {
                const flatIdx = idxMap.get("tool:" + t.id) ?? -1;
                const optionId = `search-option-tool-${t.id}`;
                return (
                  <button
                    id={optionId}
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === flatIdx}
                    onClick={() => navigate(getUrl({ kind: "tool", data: t }))}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      highlightedIndex === flatIdx
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-surface-alt"
                    }`}
                  >
                    <Wrench className="h-4 w-4 shrink-0 text-accent-secondary" />
                    <span className="flex-1 truncate text-text-primary">{t.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
