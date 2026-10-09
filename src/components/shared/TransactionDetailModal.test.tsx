import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionDetailModal } from "@/components/shared/TransactionDetailModal";
import { printReceiptHtml } from "@/lib/printReceipt";

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: "id" }),
}));

vi.mock("@/hooks/usePockets", () => ({
  usePockets: () => ({ pockets: [] }),
}));

vi.mock("@/lib/printReceipt", () => ({
  printReceiptHtml: vi.fn(),
}));

const tx = {
  id: "tx1",
  amount: 50000,
  type: "expense",
  category: "Makanan",
  merchant: "Bakso",
  payment_method: "Tunai",
  pocketId: null,
  timestamp: Date.now(),
  transferId: null,
} as never;

describe("TransactionDetailModal print", () => {
  it("prints receipt for the shown transaction", () => {
    render(
      <TransactionDetailModal
        isOpen
        onClose={() => {}}
        transaction={tx}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );
    fireEvent.click(screen.getByText("receipt.print_button"));
    expect(printReceiptHtml).toHaveBeenCalledOnce();
    expect(printReceiptHtml).toHaveBeenCalledWith(tx, expect.any(Function));
  });

  it("keeps edit and delete actions as icon buttons", () => {
    render(
      <TransactionDetailModal
        isOpen
        onClose={() => {}}
        transaction={tx}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "common.edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "common.delete" })).toBeDefined();
  });
});
