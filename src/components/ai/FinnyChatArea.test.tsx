import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FinnyChatArea from "./FinnyChatArea";
import type { FinnyMessage } from "./FinnyChatArea";

const MESSAGES: FinnyMessage[] = [
  { id: "1", role: "user", content: "halo" },
  { id: "2", role: "assistant", content: "Hai juga!" },
];

function mockScrollable(el: Element, dims: { scrollHeight: number; clientHeight: number; scrollTop: number }) {
  Object.defineProperties(el, {
    scrollHeight: { value: dims.scrollHeight, configurable: true },
    clientHeight: { value: dims.clientHeight, configurable: true },
    scrollTop: { value: dims.scrollTop, writable: true, configurable: true },
  });
}

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

  it("shows a scroll-to-bottom button only when scrolled up", () => {
    const { container } = render(<FinnyChatArea messages={MESSAGES} isLoading={false} />);
    const scroller = container.querySelector(".overflow-y-auto")!;
    const jump = screen.getByRole("button", { name: /terbaru|latest/i });
    // At the bottom → hidden
    expect(jump.className).toContain("opacity-0");

    // Scroll up → visible
    mockScrollable(scroller, { scrollHeight: 1000, clientHeight: 200, scrollTop: 100 });
    fireEvent.scroll(scroller);
    expect(jump.className).toContain("opacity-100");
    expect(jump.className).not.toContain("opacity-0");
  });

  it("scroll-to-bottom button scrolls down and hides itself", () => {
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    const { container } = render(<FinnyChatArea messages={MESSAGES} isLoading={false} />);
    const scroller = container.querySelector(".overflow-y-auto")!;
    mockScrollable(scroller, { scrollHeight: 1000, clientHeight: 200, scrollTop: 100 });
    fireEvent.scroll(scroller);

    const jump = screen.getByRole("button", { name: /terbaru|latest/i });
    fireEvent.click(jump);
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 1000 })
    );
    expect(jump.className).toContain("opacity-0");
  });
});
