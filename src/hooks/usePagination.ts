"use client";

import { useState, useEffect, useMemo } from "react";

/** Page-size choices offered by PaginationControls. */
export const PAGE_SIZE_OPTIONS = [15, 25, 50, 75] as const;

/**
 * Simple client-side pagination with adjustable page size.
 * @param totalCount total items across all pages
 * @param defaultSize initial items per page
 * @param resetKey primitive that resets back to page 1 when it changes
 * (e.g. a filter/search signature)
 */
export function usePagination(
  totalCount: number,
  defaultSize: number = 15,
  resetKey: string | number = ""
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const api = useMemo(
    () => ({
      page: safePage,
      totalPages,
      pageSize,
      setPageSize: (n: number) => {
        setPageSize(n);
        setPage(1);
      },
      next: () => setPage((p) => Math.min(p + 1, totalPages)),
      prev: () => setPage((p) => Math.max(p - 1, 1)),
    }),
    [safePage, totalPages, pageSize]
  );

  return api;
}
