import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BudgetRing } from "@/components/budget/BudgetRing";

function progressStroke(container: HTMLElement): string | null {
  const circles = container.querySelectorAll("circle");
  return circles[1]?.getAttribute("stroke") ?? null;
}

describe("BudgetRing savings goal", () => {
  it("is green when savings goal is met at 100%", () => {
    const { container } = render(<BudgetRing percentage={100} metSavingsGoal />);
    expect(progressStroke(container)).toBe("var(--color-success)");
  });

  it("stays green when over-saving above 100%", () => {
    const { container } = render(<BudgetRing percentage={100} metSavingsGoal isOverBudget={false} />);
    expect(progressStroke(container)).toBe("var(--color-success)");
  });

  it("keeps warning above 80% without the flag", () => {
    const { container } = render(<BudgetRing percentage={85} />);
    expect(progressStroke(container)).toBe("var(--color-warning)");
  });

  it("keeps danger for over-budget without the flag", () => {
    const { container } = render(<BudgetRing percentage={100} isOverBudget />);
    expect(progressStroke(container)).toBe("var(--color-danger)");
  });

  it("keeps primary for normal progress", () => {
    const { container } = render(<BudgetRing percentage={40} />);
    expect(progressStroke(container)).toBe("var(--color-primary)");
  });
});
