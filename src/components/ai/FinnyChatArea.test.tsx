import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FinnyChatArea from "./FinnyChatArea";
import type { FinnyMessage } from "./FinnyChatArea";

beforeEach(() => {
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = () => {};
});

describe("FinnyChatArea", () => {
  it("shows empty state when no messages", () => {
    render(<FinnyChatArea messages={[]} isLoading={false} />);
    expect(screen.getByText(/Halo! Aku Finny/)).toBeDefined();
  });

  it("renders messages", () => {
    const messages: FinnyMessage[] = [
      { id: "1", role: "user", content: "halo" },
      { id: "2", role: "assistant", content: "Hai juga!" },
    ];
    render(<FinnyChatArea messages={messages} isLoading={false} />);
    expect(screen.getByText("halo")).toBeDefined();
    expect(screen.getByText("Hai juga!")).toBeDefined();
  });

  it("shows typing indicator when loading", () => {
    const { container } = render(<FinnyChatArea messages={[]} isLoading={true} />);
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots.length).toBeGreaterThan(0);
  });

  it("does not show empty state when loading", () => {
    render(<FinnyChatArea messages={[]} isLoading={true} />);
    expect(screen.queryByText(/Halo! Aku Finny/)).toBeNull();
  });
});
