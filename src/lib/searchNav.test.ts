import { describe, it, expect } from "vitest";
import { buildSearchResultUrl } from "./searchNav";

describe("buildSearchResultUrl", () => {
  it("links transactions with query and focus id", () => {
    expect(buildSearchResultUrl("transaction", "tx1", "Bakso")).toBe(
      "/budget/transactions?q=Bakso&tx=tx1"
    );
  });

  it("encodes special characters", () => {
    expect(buildSearchResultUrl("transaction", "a/b", "Roti & Kue")).toBe(
      "/budget/transactions?q=Roti%20%26%20Kue&tx=a%2Fb"
    );
  });

  it("links assets and liabilities to the assets page", () => {
    expect(buildSearchResultUrl("asset", "ass1", "Tabungan")).toBe(
      "/wealth/assets?highlight=ass1"
    );
    expect(buildSearchResultUrl("liability", "lia1", "Kos")).toBe(
      "/wealth/assets?highlight=lia1"
    );
  });

  it("links debts to the debts page", () => {
    expect(buildSearchResultUrl("debt", "dbt1", "KPR")).toBe(
      "/wealth/debts?highlight=dbt1"
    );
  });

  it("links tools to the tools page", () => {
    expect(buildSearchResultUrl("tool", "export-csv", "Ekspor CSV")).toBe("/tools");
  });
});
