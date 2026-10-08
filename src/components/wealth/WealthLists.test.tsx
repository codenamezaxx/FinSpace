import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssetRow, LiabilityRow } from "@/components/wealth/WealthLists";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

const asset = {
  id: "ass1",
  name: "Tabungan",
  amount: 5000000,
  type: "liquid" as const,
};

const liability = { id: "lia1", name: "Kos", amount: 1500000 };

describe("WealthLists highlight", () => {
  it("rings the highlighted asset row", () => {
    const { container } = render(<AssetRow asset={asset} highlighted />);
    expect(container.querySelector(".ring-primary")).not.toBeNull();
  });

  it("does not ring normal rows", () => {
    const { container } = render(<AssetRow asset={asset} />);
    expect(container.querySelector(".ring-primary")).toBeNull();
  });

  it("rings the highlighted liability row", () => {
    const { container } = render(<LiabilityRow liability={liability} highlighted />);
    expect(container.querySelector(".ring-primary")).not.toBeNull();
  });
});
