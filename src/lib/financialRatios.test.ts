import { describe, it, expect } from "vitest";
import { scoreToStatus, scoreToLabel, scoreToColor } from "./financialRatios";

describe("scoreToStatus", () => {
  it("uses >=70 safe, >=40 warning, else danger", () => {
    expect(scoreToStatus(100)).toBe("safe");
    expect(scoreToStatus(74)).toBe("safe");
    expect(scoreToStatus(70)).toBe("safe");
    expect(scoreToStatus(69)).toBe("warning");
    expect(scoreToStatus(40)).toBe("warning");
    expect(scoreToStatus(39)).toBe("danger");
    expect(scoreToStatus(0)).toBe("danger");
  });

  it("agrees with scoreToLabel and scoreToColor on every score", () => {
    const labelMap = { safe: "Aman", warning: "Waspada", danger: "Bahaya" } as const;
    for (let s = 0; s <= 100; s++) {
      expect(labelMap[scoreToStatus(s)]).toBe(scoreToLabel(s));
    }
    expect(scoreToColor(74)).toBe("#22C55E");
    expect(scoreToColor(50)).toBe("#EAB393");
    expect(scoreToColor(10)).toBe("#EF4444");
  });
});
