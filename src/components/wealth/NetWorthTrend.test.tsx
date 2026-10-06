import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NetWorthTrend } from "@/components/wealth/NetWorthTrend";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

const asset = {
  id: "a1",
  name: "Tabungan",
  amount: 5000000,
  type: "liquid" as const,
  createdAt: new Date("2025-01-01").getTime(),
};

describe("NetWorthTrend", () => {
  it("shows empty hint when no history", () => {
    render(<NetWorthTrend assets={[]} liabilities={[]} transactions={[]} debts={[]} />);
    expect(screen.getByText("wealth.trend_empty")).toBeDefined();
  });

  it("renders chart and delta for nonzero history", () => {
    const { container } = render(
      <NetWorthTrend assets={[asset]} liabilities={[]} transactions={[]} debts={[]} />
    );
    expect(screen.getByText("wealth.trend_title")).toBeDefined();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
