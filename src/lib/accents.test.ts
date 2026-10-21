import { describe, expect, it } from "vitest";
import {
  ACCENT_IDS,
  ACCENT_DOTS,
  isAccent,
  parseAccent,
  type Accent,
} from "@/lib/accents";

describe("ACCENT_IDS", () => {
  it("lists all six accents in picker order", () => {
    expect(ACCENT_IDS).toEqual([
      "default",
      "ember",
      "aqua",
      "nebula",
      "bloom",
      "mono",
    ]);
  });
});

describe("isAccent", () => {
  it("accepts every id in ACCENT_IDS", () => {
    for (const id of ACCENT_IDS) expect(isAccent(id)).toBe(true);
  });
  it("rejects unknown strings", () => {
    expect(isAccent("corrupt")).toBe(false);
    expect(isAccent("")).toBe(false);
  });
});

describe("parseAccent", () => {
  it("round-trips every accent id", () => {
    for (const id of ACCENT_IDS) expect(parseAccent(id)).toBe(id);
  });
  it("falls back to default for null/garbage", () => {
    expect(parseAccent(null)).toBe("default");
    expect(parseAccent("blue")).toBe("default");
  });
});

describe("ACCENT_DOTS", () => {
  it("has a two-color swatch for every accent", () => {
    for (const id of ACCENT_IDS) {
      const dots = ACCENT_DOTS[id];
      expect(dots, `dots for ${id}`).toHaveLength(2);
      for (const c of dots) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
  it("covers exactly the Accent union", () => {
    expect(Object.keys(ACCENT_DOTS).sort()).toEqual(
      ([...ACCENT_IDS] as Accent[]).sort()
    );
  });
});
