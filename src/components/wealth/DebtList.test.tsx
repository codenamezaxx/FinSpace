import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DebtList } from "@/components/wealth/DebtList";

vi.mock("@/lib/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: "id" }),
}));

const baseDebt = {
  id: "d1",
  name: "KPR",
  totalAmount: 12000000,
  dueDate: Date.now() + 365 * 86400000,
  paidAmount: 2000000,
  createdAt: Date.now(),
};

describe("DebtList", () => {
  it("shows empty state with add CTA", () => {
    const onAdd = vi.fn();
    render(<DebtList debts={[]} onPay={() => {}} onDelete={() => {}} onAdd={onAdd} />);
    expect(screen.getByText("debt.empty_hint")).toBeDefined();
    fireEvent.click(screen.getByText("wealth.add_debt"));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("pay button triggers onPay", () => {
    const onPay = vi.fn();
    render(<DebtList debts={[baseDebt]} onPay={onPay} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("debt.pay"));
    expect(onPay).toHaveBeenCalledOnce();
  });

  it("clicking card body does not trigger pay", () => {
    const onPay = vi.fn();
    render(<DebtList debts={[baseDebt]} onPay={onPay} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("KPR"));
    expect(onPay).not.toHaveBeenCalled();
  });

  it("shows overdue chip for past-due debt", () => {
    const overdue = { ...baseDebt, dueDate: Date.now() - 86400000 };
    render(<DebtList debts={[overdue]} onPay={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("debt.overdue")).toBeDefined();
  });

  it("shows paid-off state instead of pay button", () => {
    const paid = { ...baseDebt, paidAmount: 12000000 };
    render(<DebtList debts={[paid]} onPay={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("debt.paid_off")).toBeDefined();
    expect(screen.queryByText("debt.pay")).toBeNull();
  });

  it("rings the highlighted debt", () => {
    const { container } = render(
      <DebtList debts={[baseDebt]} onPay={() => {}} onDelete={() => {}} highlightId="d1" />
    );
    expect(container.querySelector(".ring-primary")).not.toBeNull();
  });

  it("does not ring without highlight", () => {
    const { container } = render(
      <DebtList debts={[baseDebt]} onPay={() => {}} onDelete={() => {}} />
    );
    expect(container.querySelector(".ring-primary")).toBeNull();
  });
});
