import { describe, it, expect } from "vitest";
import { PRESET_POCKETS, OLD_PRESET_NAMES } from "./pocket";

describe("PRESET_POCKETS", () => {
  it("has 6 presets", () => {
    expect(PRESET_POCKETS).toHaveLength(6);
  });

  it("has Tunai as first entry", () => {
    expect(PRESET_POCKETS[0].name).toBe("Tunai");
    expect(PRESET_POCKETS[0].category).toBe("tunai");
  });

  it("has 2 ewallet presets", () => {
    const ewallet = PRESET_POCKETS.filter((p) => p.category === "ewallet");
    expect(ewallet.map((e) => e.name).sort()).toEqual(["Dana", "Gopay"]);
  });

  it("has 3 rekening presets", () => {
    const rek = PRESET_POCKETS.filter((p) => p.category === "rekening");
    expect(rek.map((r) => r.name).sort()).toEqual(["BCA", "Seabank", "Bank Jago"].sort());
  });
});

describe("OLD_PRESET_NAMES", () => {
  it("lists removed presets", () => {
    expect(OLD_PRESET_NAMES).toEqual(new Set(["Ovo", "Shopeepay", "BRI", "BNI", "Mandiri"]));
  });
});
