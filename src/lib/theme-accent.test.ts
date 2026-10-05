import { describe, expect, it } from "vitest";
import { parseStoredAccent } from "@/lib/theme-context";

describe("parseStoredAccent", () => {
  it("accepts mono", () => {
    expect(parseStoredAccent("mono")).toBe("mono");
  });
  it("falls back to default for unknown/null", () => {
    expect(parseStoredAccent(null)).toBe("default");
    expect(parseStoredAccent("blue")).toBe("default");
  });
});
