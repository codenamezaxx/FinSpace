import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MessageBubble from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders user message with content", () => {
    render(<MessageBubble role="user" content="beli bakso 35rb" />);
    expect(screen.getByText("beli bakso 35rb")).toBeDefined();
  });

  it("renders AI message with content", () => {
    render(<MessageBubble role="assistant" content="Oke, catat ya!" />);
    expect(screen.getByText("Oke, catat ya!")).toBeDefined();
  });

  it("applies different alignment for user vs AI", () => {
    const { container: userContainer } = render(
      <MessageBubble role="user" content="test" />
    );
    const { container: aiContainer } = render(
      <MessageBubble role="assistant" content="test" />
    );
    const userWrapper = userContainer.firstChild as HTMLElement;
    const aiWrapper = aiContainer.firstChild as HTMLElement;
    expect(userWrapper.className).toContain("justify-end");
    expect(aiWrapper.className).toContain("justify-start");
  });
});
