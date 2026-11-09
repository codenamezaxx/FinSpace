import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationBar } from "../NavigationBar";
import { BalancePrivacyProvider } from "@/lib/balancePrivacy";

const { useCloudAuthMock, logoutMock, loginMock } = vi.hoisted(() => ({
  useCloudAuthMock: vi.fn(),
  logoutMock: vi.fn(),
  loginMock: vi.fn(),
}));

vi.mock("@/hooks/useCloudAuth", () => ({
  useCloudAuth: useCloudAuthMock,
}));

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
  beforeEach(() => {
    logoutMock.mockReset();
    loginMock.mockReset();
    useCloudAuthMock.mockReturnValue({
      user: {
        name: "Test User",
        email: "test@example.com",
        isLoggedIn: true,
      },
      isLoggedIn: true,
      logout: logoutMock,
      login: loginMock,
    });
  });

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

  it("shows the signed-in user and logs out from the sidebar", () => {
    renderWithProviders(<NavigationBar />);

    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText("test@example.com")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    expect(screen.queryByText("Keluar")).toBeNull();
    expect(logoutMock).toHaveBeenCalledOnce();
  });

  it("only shows logout in a dropdown after clicking the collapsed profile", () => {
    const { container } = renderWithProviders(<NavigationBar isCollapsed />);
    const accountMenu = container.querySelector("details");

    expect(screen.queryByText("test@example.com")).toBeNull();
    expect(accountMenu?.open).toBe(false);

    const profileToggle = container.querySelector("summary");
    expect(profileToggle).not.toBeNull();
    if (profileToggle) fireEvent.click(profileToggle);
    expect(accountMenu?.open).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    expect(accountMenu?.open).toBe(false);
    expect(logoutMock).toHaveBeenCalledOnce();
  });

  it("shows a guest profile and sign-in button when logged out", () => {
    useCloudAuthMock.mockReturnValue({
      user: null,
      isLoggedIn: false,
      login: loginMock,
      logout: logoutMock,
    });
    renderWithProviders(<NavigationBar />);

    expect(screen.getByText("Tamu")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(loginMock).toHaveBeenCalledOnce();
  });

  it("offers sign-in from the collapsed guest profile menu", () => {
    useCloudAuthMock.mockReturnValue({
      user: null,
      isLoggedIn: false,
      login: loginMock,
      logout: logoutMock,
    });
    const { container } = renderWithProviders(<NavigationBar isCollapsed />);
    const accountMenu = container.querySelector("details");

    expect(accountMenu).not.toBeNull();
    if (accountMenu) fireEvent.click(accountMenu.querySelector("summary")!);
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(loginMock).toHaveBeenCalledOnce();
    expect(accountMenu?.open).toBe(false);
  });
});
