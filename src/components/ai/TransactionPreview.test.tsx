import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TransactionPreview from "./TransactionPreview";

describe("TransactionPreview", () => {
  it("renders transaction preview with data", () => {
    render(
      <TransactionPreview
        action="transaction"
        data={{
          type: "expense",
          amount: 35000,
          merchant: "Bakso",
          category: "Makanan & Minuman",
          payment_method: "Cash",
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Rp35.000")).toBeDefined();
    expect(screen.getByDisplayValue("Bakso")).toBeDefined();
  });

  it("renders asset preview", () => {
    render(
      <TransactionPreview
        action="asset"
        data={{
          asset_type: "investment",
          name: "BBCA",
          amount: 5000000,
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Investasi (Saham/Emas/Reksadana)")).toBeDefined();
    expect(screen.getByDisplayValue("BBCA")).toBeDefined();
  });

  it("renders liability preview", () => {
    render(
      <TransactionPreview
        action="liability"
        data={{ name: "Pinjam Rudi", amount: 500000 }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Pinjam Rudi")).toBeDefined();
  });

  it("renders debt preview", () => {
    render(
      <TransactionPreview
        action="debt"
        data={{
          name: "Kredit Motor",
          totalAmount: 15000000,
          paidAmount: 0,
          dueDate: "2027-12-01",
          interestRate: 10,
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Kredit Motor")).toBeDefined();
    expect(screen.getByDisplayValue("2027-12-01")).toBeDefined();
  });

  it("calls onSave when Simpan clicked", () => {
    const onSave = vi.fn();
    render(
      <TransactionPreview
        action="transaction"
        data={{
          type: "expense",
          amount: 35000,
          merchant: "Bakso",
          category: "Makanan & Minuman",
          payment_method: "Cash",
        }}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Simpan"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("transaction", expect.any(Object));
  });

  it("calls onCancel when Batal clicked", () => {
    const onCancel = vi.fn();
    render(
      <TransactionPreview
        action="transaction"
        data={{
          type: "expense",
          amount: 35000,
          merchant: "Bakso",
          category: "Makanan & Minuman",
          payment_method: "Cash",
        }}
        onSave={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText("Batal"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
