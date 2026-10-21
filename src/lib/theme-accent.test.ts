import { describe, expect, it } from "vitest";
import { parseStoredAccent } from "@/lib/theme-context";
import { ACCENT_IDS } from "@/lib/accents";

describe("parseStoredAccent", () => {
  it("accepts every known accent id", () => {
    for (const id of ACCENT_IDS) {
      expect(parseStoredAccent(id)).toBe(id);
    }
  });
  it("falls back to default for unknown/null", () => {
    expect(parseStoredAccent(null)).toBe("default");
    expect(parseStoredAccent("blue")).toBe("default");
  });
});
