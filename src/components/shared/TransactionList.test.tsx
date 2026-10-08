import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionList } from "@/components/shared/TransactionList";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: "id" }),
}));

vi.mock("@/hooks/usePockets", () => ({
  usePockets: () => ({ pockets: [] }),
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({
    transactions: [
      {
        id: "tx1",
        amount: 50000,
        type: "expense",
        category: "Makanan",
        merchant: "Bakso",
        payment_method: "Tunai",
        pocketId: null,
        timestamp: Date.now(),
        transferId: null,
      },
    ],
    loading: false,
    deleteTransaction: vi.fn(),
    updateTransaction: vi.fn(),
  }),
}));

describe("TransactionList focusTxId", () => {
  it("auto-opens the detail modal for the focused transaction", () => {
    render(<TransactionList focusTxId="tx1" />);
    // print button only exists inside the detail modal
    expect(screen.getByText("receipt.print_button")).toBeDefined();
  });

  it("does not auto-open without focusTxId", () => {
    render(<TransactionList />);
    expect(screen.queryByText("receipt.print_button")).toBeNull();
  });
});
