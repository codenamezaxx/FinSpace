import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationBar } from "../NavigationBar";
import { BalancePrivacyProvider } from "@/lib/balancePrivacy";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock next/link to render as <a>
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock transaction modal context
vi.mock("@/lib/transaction-modal-context", () => ({
  useTransactionModal: () => ({
    openAddTransaction: vi.fn(),
  }),
}));

// Helper to wrap with required providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<BalancePrivacyProvider>{ui}</BalancePrivacyProvider>);
}

describe("NavigationBar", () => {
  it("renders all standard nav links", () => {
    renderWithProviders(<NavigationBar />);
    // Each nav link appears twice — mobile nav + sidebar
    expect(screen.getAllByText("Dasbor").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Anggaran").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Kekayaan").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Alat").length).toBeGreaterThanOrEqual(1);
  });

  it("renders scan button when onScan prop is provided", () => {
    renderWithProviders(<NavigationBar onScan={vi.fn()} />);
    const scanBtn = screen.getByLabelText("Scan struk");
    expect(scanBtn).toBeDefined();
  });

  it("does NOT render scan button when onScan is undefined", () => {
    renderWithProviders(<NavigationBar />);
    expect(screen.queryByLabelText("Scan struk")).toBeNull();
  });

  it("calls onScan when scan button clicked", () => {
    const onScan = vi.fn();
    renderWithProviders(<NavigationBar onScan={onScan} />);
    const scanBtn = screen.getByLabelText("Scan struk");
    fireEvent.click(scanBtn);
    expect(onScan).toHaveBeenCalledOnce();
  });

  it("renders expanded sidebar toggle by default", () => {
    renderWithProviders(<NavigationBar onToggle={vi.fn()} />);
    const toggleBtn = screen.getByLabelText("Ciutkan sidebar");
    expect(toggleBtn).toBeDefined();
  });

  it("renders collapsed state toggle label", () => {
    renderWithProviders(<NavigationBar isCollapsed={true} onToggle={vi.fn()} />);
    const toggleBtn = screen.getByLabelText("Perluas sidebar");
    expect(toggleBtn).toBeDefined();
  });

  it("renders expanded state toggle label", () => {
    renderWithProviders(<NavigationBar isCollapsed={false} onToggle={vi.fn()} />);
    const toggleBtn = screen.getByLabelText("Ciutkan sidebar");
    expect(toggleBtn).toBeDefined();
  });
});
