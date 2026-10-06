import { describe, it, expect } from "vitest";
import { formatChartYAxis } from "./monthlyChart";

describe("formatChartYAxis", () => {
  it("formats millions without trailing .0", () => {
    expect(formatChartYAxis(1721815)).toBe("1.7jt");
    expect(formatChartYAxis(8000000)).toBe("8jt");
    expect(formatChartYAxis(2000000)).toBe("2jt");
  });

  it("formats thousands and small values", () => {
    expect(formatChartYAxis(10000)).toBe("10rb");
    expect(formatChartYAxis(999)).toBe("999");
    expect(formatChartYAxis(0)).toBe("0");
  });

  it("formats billions", () => {
    expect(formatChartYAxis(2500000000)).toBe("2.5M");
  });
});
