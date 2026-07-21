import { describe, it, expect } from "vitest";
import { buildScanPrompt } from "./scan-prompt";

describe("buildScanPrompt", () => {
  it("contains receipt analysis instructions", () => {
    const prompt = buildScanPrompt();
    expect(prompt).toContain("struk");
    expect(prompt).toContain("JSON");
  });

  it("includes pocket names when provided", () => {
    const prompt = buildScanPrompt(["Tunai", "BCA"]);
    expect(prompt).toContain("Tunai");
    expect(prompt).toContain("BCA");
  });

  it("skips pocket section when not provided", () => {
    const prompt = buildScanPrompt();
    expect(prompt).not.toContain("KANTONG PENGGUNA");
  });
});
