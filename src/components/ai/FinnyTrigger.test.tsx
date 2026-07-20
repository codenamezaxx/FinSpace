import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FinnyTrigger from "./FinnyTrigger";

describe("FinnyTrigger", () => {
  it("renders a button with Bot icon", () => {
    render(<FinnyTrigger onClick={vi.fn()} />);
    const btn = screen.getByLabelText("Buka Finny AI");
    expect(btn).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<FinnyTrigger onClick={onClick} />);
    fireEvent.click(screen.getByLabelText("Buka Finny AI"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
