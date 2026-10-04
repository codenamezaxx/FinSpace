"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
}

/** Prev/next pager with numeric "page / total" label + items-per-page selector. */
export function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  pageSize,
  onPageSizeChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        aria-label="Items per page"
        className="h-8 rounded-lg border border-border bg-surface px-2 font-mono text-xs text-text-secondary outline-none transition-colors hover:bg-surface-alt focus:border-primary"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className={btn}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-mono text-xs text-text-muted">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className={btn}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
