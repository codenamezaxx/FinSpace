import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders user message with content", () => {
    render(<MessageBubble id="m1" role="user" content="beli bakso 35rb" />);
    expect(screen.getByText("beli bakso 35rb")).toBeDefined();
  });

  it("renders AI message with content", () => {
    render(<MessageBubble id="m2" role="assistant" content="Oke, catat ya!" />);
    expect(screen.getByText("Oke, catat ya!")).toBeDefined();
  });

  it("applies different alignment for user vs AI", () => {
    const { container: userContainer } = render(
      <MessageBubble id="m1" role="user" content="test" />
    );
    const { container: aiContainer } = render(
      <MessageBubble id="m2" role="assistant" content="test" />
    );
    const userWrapper = userContainer.firstChild as HTMLElement;
    const aiWrapper = aiContainer.firstChild as HTMLElement;
    expect(userWrapper.className).toContain("justify-end");
    expect(aiWrapper.className).toContain("justify-start");
  });

  it("shows unsend button on user bubbles and calls back with the id", () => {
    const onUnsend = vi.fn();
    render(
      <MessageBubble id="m9" role="user" content="halo" onUnsend={onUnsend} />
    );
    const btn = screen.getByRole("button", { name: /batalkan pesan|unsend/i });
    fireEvent.click(btn);
    expect(onUnsend).toHaveBeenCalledWith("m9");
  });

  it("hides unsend button on assistant bubbles", () => {
    const onUnsend = vi.fn();
    render(
      <MessageBubble id="m9" role="assistant" content="hai" onUnsend={onUnsend} />
    );
    expect(
      screen.queryByRole("button", { name: /batalkan pesan|unsend/i })
    ).toBeNull();
  });
});
