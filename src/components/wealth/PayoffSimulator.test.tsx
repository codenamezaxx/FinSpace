import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PayoffSimulator } from "@/components/wealth/PayoffSimulator";
import { BalancePrivacyProvider } from "@/lib/balancePrivacy";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: "id" }),
}));

const debt = {
  id: "d1",
  name: "KPR",
  totalAmount: 12000000,
  dueDate: Date.now() + 365 * 86400000,
  paidAmount: 0,
  createdAt: Date.now(),
};

function renderWithPrivacy(ui: React.ReactElement) {
  return render(<BalancePrivacyProvider>{ui}</BalancePrivacyProvider>);
}

describe("PayoffSimulator", () => {
  it("shows debt-free state when no unpaid debts", () => {
    renderWithPrivacy(<PayoffSimulator debts={[]} />);
    expect(screen.getByText("wealth.sim_debt_free_state")).toBeDefined();
  });

  it("projects baseline payoff months", () => {
    renderWithPrivacy(<PayoffSimulator debts={[debt]} />);
    expect(screen.getByText("wealth.sim_title")).toBeDefined();
    expect(screen.getByText("13")).toBeDefined();
  });

  it("accelerates payoff with extra payment", () => {
    renderWithPrivacy(<PayoffSimulator debts={[debt]} />);
    fireEvent.change(screen.getByLabelText("wealth.sim_extra_label"), {
      target: { value: "1000000" },
    });
    expect(screen.getByText("7")).toBeDefined();
  });
});