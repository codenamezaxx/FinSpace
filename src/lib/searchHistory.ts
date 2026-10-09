"use client";

import type { SearchResultKind } from "./searchNav";

/**
 * Global-search history. Each entry remembers WHAT KIND of item it was
 * (transaction, asset, liability, debt, tool) plus its id, so revisiting
 * it navigates to the right page — never blindly to the transactions list.
 *
 * Legacy entries were plain strings; they migrate to transaction-kind
 * text searches on load.
 */

export interface RecentEntry {
  q: string;
  kind: SearchResultKind;
  /** Empty for migrated legacy entries (route falls back to text search). */
  id: string;
}

const RECENT_KEY = "finspace_recent_searches";
const MAX_RECENT = 5;

function entryKey(e: RecentEntry): string {
  return e.id ? `${e.kind}:${e.id}` : `text:${e.q}`;
}

function normalize(raw: unknown): RecentEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: RecentEntry[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ q: item, kind: "transaction", id: "" });
    } else if (
      item !== null &&
      typeof item === "object" &&
      typeof (item as RecentEntry).q === "string" &&
      (item as RecentEntry).q.trim()
    ) {
      const e = item as Partial<RecentEntry>;
      out.push({
        q: (e.q as string).trim(),
        kind:
          e.kind === "asset" ||
          e.kind === "liability" ||
          e.kind === "debt" ||
          e.kind === "tool" ||
          e.kind === "transaction"
            ? e.kind
            : "transaction",
        id: typeof e.id === "string" ? e.id : "",
      });
    }
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}

export function getRecentSearches(): RecentEntry[] {
  try {
    return normalize(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function addRecentSearch(entry: RecentEntry): RecentEntry[] {
  const key = entryKey(entry);
  const list = getRecentSearches().filter((e) => entryKey(e) !== key);
  list.unshift({ ...entry, q: entry.q.trim() });
  const trimmed = list.slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail — localStorage may be full or unavailable
  }
  return trimmed;
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Silently fail
  }
}
