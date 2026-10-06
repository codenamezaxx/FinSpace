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

describe("niceCeil", () => {
  it("rounds up to a nice axis ceiling", async () => {
    const { niceCeil } = await import("./monthlyChart");
    expect(niceCeil(0)).toBe(0);
    expect(niceCeil(1721815)).toBe(2000000);
    expect(niceCeil(3040000)).toBe(5000000);
    expect(niceCeil(500)).toBe(500);
    expect(niceCeil(1001)).toBe(2000);
  });
});
