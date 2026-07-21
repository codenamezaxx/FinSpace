import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ScanResultModal from "./ScanResultModal";

// Mock TransactionPreview since it's tested separately
vi.mock("./TransactionPreview", () => ({
  default: ({ onSave, onCancel, action }: any) => (
    <div data-testid="transaction-preview">
      <button onClick={() => onSave(action, { amount: 50000 })}>Simpan</button>
      <button onClick={onCancel}>Batal</button>
    </div>
  ),
}));

describe("ScanResultModal", () => {
  const baseProps = {
    isOpen: true,
    imageDataUrl: "data:image/jpeg;base64,test",
    result: null,
    isLoading: false,
    error: null,
    onSave: vi.fn(),
    onClose: vi.fn(),
    onRetry: vi.fn(),
  };

  it("renders nothing when not open", () => {
    const { container } = render(
      <ScanResultModal {...baseProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows image preview when open", () => {
    render(<ScanResultModal {...baseProps} />);
    const img = screen.getByRole("img", { name: /Preview struk/i }) as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain("base64,test");
  });

  it("shows loading spinner when processing", () => {
    render(<ScanResultModal {...baseProps} isLoading={true} />);
    expect(screen.getByText("Memproses struk...")).toBeDefined();
  });

  it("shows error state with retry button", () => {
    render(
      <ScanResultModal {...baseProps} error="Gagal scan" />
    );
    expect(screen.getByText("Gagal scan")).toBeDefined();
    expect(screen.getByText("Coba Lagi")).toBeDefined();
  });

  it("calls onClose when Batal clicked in TransactionPreview", () => {
    const onClose = vi.fn();
    render(
      <ScanResultModal
        {...baseProps}
        onClose={onClose}
        result={{
          action: "transaction",
          message: "Oke",
          data: { type: "expense", amount: 35000, merchant: "Test", category: "Belanja", payment_method: "Cash", pocket_name: "Tunai" },
          confidence: "high",
        }}
      />
    );
    const batalBtn = screen.getByText("Batal");
    fireEvent.click(batalBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onRetry when Coba Lagi clicked in error state", () => {
    const onRetry = vi.fn();
    render(
      <ScanResultModal
        {...baseProps}
        error="Gagal scan"
        onRetry={onRetry}
      />
    );
    const retryBtn = screen.getByText("Coba Lagi");
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows TransactionPreview when result with data arrives", () => {
    render(
      <ScanResultModal
        {...baseProps}
        result={{
          action: "transaction",
          message: "Oke, catat ya!",
          data: { type: "expense", amount: 35000, merchant: "Indomaret", category: "Belanja", payment_method: "Cash", pocket_name: "Tunai" },
          confidence: "high",
        }}
      />
    );
    expect(screen.getByTestId("transaction-preview")).toBeDefined();
    expect(screen.getByText("Simpan")).toBeDefined();
  });

  it("shows Tutup button when result without data", () => {
    render(
      <ScanResultModal
        {...baseProps}
        result={{
          action: "chat",
          message: "Tidak bisa membaca struk",
          confidence: "low",
        }}
      />
    );
    expect(screen.getByText("Tutup")).toBeDefined();
  });
});
