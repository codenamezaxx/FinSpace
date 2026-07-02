import { describe, it, expect } from "vitest";
import { PRESET_POCKETS, OLD_PRESET_NAMES } from "./pocket";
import type { Transaction } from "./db";

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

describe("transfer transaction pair", () => {
  it("creates expense + income pair with shared transferId", () => {
    const transferId = crypto.randomUUID();
    const fromPocketId = crypto.randomUUID();
    const toPocketId = crypto.randomUUID();
    const amount = 100000;

    const expense: Transaction = {
      id: crypto.randomUUID(),
      type: "expense",
      amount,
      category: "Pindah Saldo",
      merchant: "Transfer ke Dana",
      payment_method: "Tunai",
      timestamp: 1000,
      transferId,
      pocketId: fromPocketId,
    };

    const income: Transaction = {
      id: crypto.randomUUID(),
      type: "income",
      amount,
      category: "Pindah Saldo",
      merchant: "Transfer dari Tunai",
      payment_method: "Dana",
      timestamp: 1001,
      transferId,
      pocketId: toPocketId,
    };

    // Verify types
    expect(expense.type).toBe("expense");
    expect(income.type).toBe("income");

    // Verify amounts
    expect(expense.amount).toBe(amount);
    expect(income.amount).toBe(amount);

    // Verify shared transferId
    expect(expense.transferId).toBe(transferId);
    expect(income.transferId).toBe(transferId);

    // Verify pocketIds
    expect(expense.pocketId).toBe(fromPocketId);
    expect(income.pocketId).toBe(toPocketId);

    // Verify merchants
    expect(expense.merchant).toBe("Transfer ke Dana");
    expect(income.merchant).toBe("Transfer dari Tunai");

    // Verify categories
    expect(expense.category).toBe("Pindah Saldo");
    expect(income.category).toBe("Pindah Saldo");

    // Verify payment_method references pocket names
    expect(expense.payment_method).toBe("Tunai");
    expect(income.payment_method).toBe("Dana");

    // Verify timestamps: expense comes before income
    expect(expense.timestamp).toBeLessThan(income.timestamp);
  });
});
