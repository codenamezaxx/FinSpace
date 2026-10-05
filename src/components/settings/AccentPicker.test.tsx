import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccentPicker } from "@/components/settings/AccentPicker";

const setAccent = vi.fn();
vi.mock("@/lib/theme-context", () => ({
  useTheme: () => ({ accent: "default" as const, setAccent }),
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

describe("AccentPicker", () => {
  it("renders two radio options with default checked", () => {
    render(<AccentPicker />);
    const opts = screen.getAllByRole("radio");
    expect(opts).toHaveLength(2);
    expect(opts[0].getAttribute("aria-checked")).toBe("true");
  });
  it("calls setAccent mono on click", () => {
    render(<AccentPicker />);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(setAccent).toHaveBeenCalledWith("mono");
  });
});
