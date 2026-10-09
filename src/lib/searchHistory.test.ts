import { describe, it, expect, beforeEach } from "vitest";
import {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from "./searchHistory";

describe("searchHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores kind + id with each entry", () => {
    addRecentSearch({ q: "Emas", kind: "asset", id: "ass_1" });
    const [entry] = getRecentSearches();
    expect(entry).toEqual({ q: "Emas", kind: "asset", id: "ass_1" });
  });

  it("dedupes by kind+id, most recent first, capped at 5", () => {
    for (let i = 0; i < 7; i++) {
      addRecentSearch({ q: `Q${i}`, kind: "transaction", id: `t${i}` });
    }
    const list = getRecentSearches();
    expect(list).toHaveLength(5);
    expect(list[0].q).toBe("Q6");
    // re-adding bumps to top without duplicating
    addRecentSearch({ q: "Q3", kind: "transaction", id: "t3" });
    const again = getRecentSearches();
    expect(again).toHaveLength(5);
    expect(again[0].id).toBe("t3");
  });

  it("migrates legacy plain-string entries to transaction text searches", () => {
    localStorage.setItem(
      "finspace_recent_searches",
      JSON.stringify(["Bakso", { q: "Emas", kind: "asset", id: "ass_9" }, 42, null])
    );
    expect(getRecentSearches()).toEqual([
      { q: "Bakso", kind: "transaction", id: "" },
      { q: "Emas", kind: "asset", id: "ass_9" },
    ]);
  });

  it("clears the history", () => {
    addRecentSearch({ q: "x", kind: "tool", id: "tool_1" });
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });
});
