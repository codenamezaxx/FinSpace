import { describe, it, expect } from "vitest";
import { PRESET_POCKETS } from "./pocket";

describe("PRESET_POCKETS", () => {
  it("has 11 presets", () => {
    expect(PRESET_POCKETS).toHaveLength(11);
  });

  it("has Tunai as first entry", () => {
    expect(PRESET_POCKETS[0].name).toBe("Tunai");
    expect(PRESET_POCKETS[0].category).toBe("tunai");
  });

  it("has 4 ewallet presets", () => {
    const ewallet = PRESET_POCKETS.filter((p) => p.category === "ewallet");
    expect(ewallet.map((e) => e.name).sort()).toEqual(["Dana", "Gopay", "Ovo", "Shopeepay"]);
  });

  it("has 6 rekening presets", () => {
    const rek = PRESET_POCKETS.filter((p) => p.category === "rekening");
    expect(rek.map((r) => r.name).sort()).toEqual(["BCA", "BRI", "BNI", "Mandiri", "Seabank", "Bank Jago"].sort());
  });
});
