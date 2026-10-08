import { describe, it, expect } from "vitest";
import { detectMessageLanguage } from "./detectLanguage";

describe("detectMessageLanguage", () => {
  it("detects Indonesian", () => {
    expect(detectMessageLanguage("aku abis beli makan siang 17rb")).toBe("id");
    expect(detectMessageLanguage("tolong kasih tahu total pengeluaranku")).toBe("id");
  });

  it("detects English", () => {
    expect(detectMessageLanguage("how much did I spend on food?")).toBe("en");
    expect(detectMessageLanguage("show me my savings please")).toBe("en");
  });

  it("falls back on empty, numeric or ambiguous input", () => {
    expect(detectMessageLanguage("")).toBe("id");
    expect(detectMessageLanguage("25000")).toBe("id");
    expect(detectMessageLanguage("halo")).toBe("id");
    expect(detectMessageLanguage("kopi 25rb", "en")).toBe("en");
  });

  it("majority wins on mixed input", () => {
    expect(detectMessageLanguage("aku mau transfer money ke bank please")).toBe("id");
  });
});
