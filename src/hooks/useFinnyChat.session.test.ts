import { describe, it, expect } from "vitest";
import {
  sessionTitleFor,
  shouldApplyAiTitle,
  isActionableMessage,
  type FinnyMessage,
} from "./useFinnyChat";

describe("sessionTitleFor", () => {
  it("trims and collapses whitespace", () => {
    expect(sessionTitleFor("  beli   kopi\n25rb  ")).toBe("beli kopi 25rb");
  });

  it("returns short text unchanged", () => {
    expect(sessionTitleFor("halo")).toBe("halo");
  });

  it("truncates long text with ellipsis", () => {
    const long = "a".repeat(100);
    const title = sessionTitleFor(long);
    expect(title.length).toBeLessThanOrEqual(43);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("isActionableMessage", () => {
  const base: FinnyMessage = {
    id: "m1",
    role: "assistant",
    content: "ok",
    action: "transaction",
    data: { amount: 1 },
  };

  it("accepts fresh action messages", () => {
    expect(isActionableMessage(base)).toBe(true);
  });

  it("rejects handled messages (saved/dismissed previews never resurrect)", () => {
    expect(isActionableMessage({ ...base, handled: true })).toBe(false);
  });

  it("rejects chat/clarify and dataless messages", () => {
    expect(isActionableMessage({ ...base, action: "chat" })).toBe(false);
    expect(isActionableMessage({ ...base, action: "clarify" })).toBe(false);
    expect(isActionableMessage({ ...base, data: undefined })).toBe(false);
    expect(
      isActionableMessage({ ...base, role: "user", action: undefined })
    ).toBe(false);
  });
});

describe("shouldApplyAiTitle", () => {
  it("allows the AI title while the title is still auto-generated", () => {
    expect(shouldApplyAiTitle("beli kopi 25rb", "beli kopi 25rb")).toBe(true);
  });

  it("blocks the AI title after a manual rename", () => {
    expect(shouldApplyAiTitle("Ngopi Santai", "beli kopi 25rb")).toBe(false);
  });
});
