/**
 * Deep-link targets for global search results.
 * Single source of truth so the dropdown and tests agree on routes.
 */

export type SearchResultKind =
  | "transaction"
  | "asset"
  | "liability"
  | "debt"
  | "tool";

export function buildSearchResultUrl(
  kind: SearchResultKind,
  id: string,
  label: string
): string {
  switch (kind) {
    case "transaction":
      return `/budget/transactions?q=${encodeURIComponent(label)}&tx=${encodeURIComponent(id)}`;
    case "asset":
    case "liability":
      // Liabilities live on the assets page — the page scrolls to the match.
      return `/wealth/assets?highlight=${encodeURIComponent(id)}`;
    case "debt":
      return `/wealth/debts?highlight=${encodeURIComponent(id)}`;
    case "tool":
      return "/tools";
  }
}
