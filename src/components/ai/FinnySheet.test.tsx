import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FinnySheet from "./FinnySheet";

// Mock useFinnyChat
vi.mock("@/hooks/useFinnyChat", () => ({
  useFinnyChat: () => ({
    messages: [],
    isLoading: false,
    isOffline: false,
    error: null,
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
    dismissError: vi.fn(),
  }),
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    transactions: { add: vi.fn() },
  },
}));

describe("FinnySheet", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <FinnySheet isOpen={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders when open", () => {
    render(<FinnySheet isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Finny")).toBeDefined();
    expect(screen.getByText("Asisten Keuangan")).toBeDefined();
  });

  it("shows empty state in chat area", () => {
    render(<FinnySheet isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Halo! Aku Finny/)).toBeDefined();
  });
});
