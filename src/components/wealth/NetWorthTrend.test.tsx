import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NetWorthTrend } from "@/components/wealth/NetWorthTrend";
import { BalancePrivacyProvider } from "@/lib/balancePrivacy";

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

function renderWithPrivacy(ui: React.ReactElement) {
  return render(<BalancePrivacyProvider>{ui}</BalancePrivacyProvider>);
}

describe("NetWorthTrend", () => {
  it("shows empty hint when no history", () => {
    renderWithPrivacy(<NetWorthTrend assets={[]} liabilities={[]} transactions={[]} debts={[]} />);
    expect(screen.getByText("wealth.trend_empty")).toBeDefined();
  });

  it("renders chart and delta for nonzero history", () => {
    const { container } = renderWithPrivacy(
      <NetWorthTrend assets={[asset]} liabilities={[]} transactions={[]} debts={[]} />
    );
    expect(screen.getByText("wealth.trend_title")).toBeDefined();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});