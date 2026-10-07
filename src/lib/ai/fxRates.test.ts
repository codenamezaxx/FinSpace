import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFxContext, __resetFxCache } from "./fxRates";

const PAYLOAD = {
  result: "success",
  time_last_update_utc: "Sat, 04 Oct 2026 00:00:01 +0000",
  rates: { IDR: 16000, USD: 1, SGD: 1.33, EUR: 0.94, FOO: -5 },
};

describe("getFxContext", () => {
  beforeEach(() => {
    __resetFxCache();
    vi.unstubAllGlobals();
  });

  it("formats live rates as IDR per unit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => PAYLOAD })
    );
    const text = await getFxContext();
    expect(text).toContain("KURS LIVE");
    expect(text).toContain("1 USD = Rp16.000");
    expect(text).toContain("1 SGD = Rp12.030");
    // invalid rates skipped
    expect(text).not.toContain("FOO");
  });

  it("caches within TTL (single fetch)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => PAYLOAD });
    vi.stubGlobal("fetch", fetchMock);
    await getFxContext(1_000_000);
    await getFxContext(1_000_000 + 1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches after TTL expiry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => PAYLOAD });
    vi.stubGlobal("fetch", fetchMock);
    await getFxContext(1_000_000);
    await getFxContext(1_000_000 + 13 * 3600 * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to static anchors on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    const text = await getFxContext();
    expect(text).toContain("KURS ACUAN");
  });

  it("falls back on bad payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    const text = await getFxContext();
    expect(text).toContain("KURS ACUAN");
  });
});
