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
  it("renders six radio options in ACCENT_IDS order with default checked", () => {
    render(<AccentPicker />);
    const opts = screen.getAllByRole("radio");
    expect(opts).toHaveLength(6);
    expect(opts[0].getAttribute("aria-checked")).toBe("true");
    expect(opts[0].textContent).toContain("settings.accent_default");
    expect(opts[1].textContent).toContain("settings.accent_ember");
    expect(opts[2].textContent).toContain("settings.accent_aqua");
    expect(opts[3].textContent).toContain("settings.accent_nebula");
    expect(opts[4].textContent).toContain("settings.accent_bloom");
    expect(opts[5].textContent).toContain("settings.accent_mono");
  });
  it("calls setAccent with the clicked accent id", () => {
    render(<AccentPicker />);
    fireEvent.click(screen.getAllByRole("radio")[1]); // ember
    expect(setAccent).toHaveBeenCalledWith("ember");
    fireEvent.click(screen.getAllByRole("radio")[5]); // mono
    expect(setAccent).toHaveBeenCalledWith("mono");
  });
});
