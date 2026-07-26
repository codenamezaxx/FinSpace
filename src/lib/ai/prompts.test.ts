import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT, buildSystemPrompt } from "./prompts";

describe("SYSTEM_PROMPT", () => {
  it("contains all 7 action types", () => {
    const actions = ["transaction", "asset", "liability", "debt", "create_pocket", "clarify", "chat"];
    for (const action of actions) {
      expect(SYSTEM_PROMPT).toContain(`"${action}"`);
    }
  });

  it("contains valid expense categories", () => {
    const categories = [
      "Makanan & Minuman",
      "Transportasi",
      "Tagihan",
      "Kesehatan",
      "Pendidikan",
      "Belanja",
      "Hiburan",
    ];
    for (const cat of categories) {
      expect(SYSTEM_PROMPT).toContain(cat);
    }
  });

  it("contains valid income categories", () => {
    expect(SYSTEM_PROMPT).toContain("Gaji");
    expect(SYSTEM_PROMPT).toContain("Freelance");
    expect(SYSTEM_PROMPT).toContain("Investasi");
  });

  it("contains payment methods", () => {
    const methods = ["Cash", "Transfer Bank", "QRIS", "Kartu Kredit", "Kartu Debit", "E-Wallet", "Lainnya"];
    for (const method of methods) {
      expect(SYSTEM_PROMPT).toContain(method);
    }
  });

  it("contains all 4 asset types", () => {
    expect(SYSTEM_PROMPT).toContain("liquid");
    expect(SYSTEM_PROMPT).toContain("investment");
    expect(SYSTEM_PROMPT).toContain("property");
    expect(SYSTEM_PROMPT).toContain("other");
  });

  it("buildSystemPrompt returns the prompt with default Indonesian instruction", () => {
    const result = buildSystemPrompt();
    expect(result).toContain(SYSTEM_PROMPT);
    expect(result).toContain("Kamu WAJIB merespon dalam Bahasa Indonesia");
  });

  it("buildSystemPrompt appends English instruction when language is 'en'", () => {
    const result = buildSystemPrompt(undefined, "en");
    expect(result).toContain(SYSTEM_PROMPT);
    expect(result).toContain("You MUST respond in English");
  });

  it("buildSystemPrompt includes pocket section and language instruction when pockets given", () => {
    const result = buildSystemPrompt(["BCA", "Tunai"], "en");
    expect(result).toContain("BCA");
    expect(result).toContain("Tunai");
    expect(result).toContain("You MUST respond in English");
  });
});
