import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssetAllocation } from "@/components/wealth/AssetAllocation";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

const assets = [
  { id: "a1", name: "Tunai", amount: 6000000, type: "liquid" as const },
  { id: "a2", name: "Reksadana", amount: 3000000, type: "investment" as const },
  { id: "a3", name: "Tanah", amount: 1000000, type: "property" as const },
];

describe("AssetAllocation", () => {
  it("shows empty hint when no assets", () => {
    render(<AssetAllocation assets={[]} />);
    expect(screen.getByText("wealth.allocation_empty")).toBeDefined();
  });

  it("renders donut with total and slices", () => {
    const { container } = render(<AssetAllocation assets={assets} />);
    expect(screen.getByText("wealth.allocation_title")).toBeDefined();
    expect(container.querySelector("svg")).not.toBeNull();
    // 60% liquid slice legend
    expect(screen.getByText("60.0%")).toBeDefined();
  });
});
