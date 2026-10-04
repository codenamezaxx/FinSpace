import { describe, it, expect } from "vitest";
import { extractJsonCandidates, parseScanResponse } from "./scan-parse";

describe("extractJsonCandidates", () => {
  it("finds plain JSON", () => {
    const out = extractJsonCandidates('{"action":"chat"}');
    expect(out).toEqual(['{"action":"chat"}']);
  });

  it("strips markdown fences", () => {
    const out = extractJsonCandidates(
      'Here you go:\n```json\n{"action":"transaction"}\n```'
    );
    expect(out).toEqual(['{"action":"transaction"}']);
  });

  it("ignores braces inside strings and prose", () => {
    const out = extractJsonCandidates(
      'Total {not json} then {"action":"chat","message":"hi {there}"}'
    );
    expect(out).toHaveLength(2);
    // longest first → the real object
    expect(out[0]).toContain('"action":"chat"');
  });

  it("handles nested objects", () => {
    const out = extractJsonCandidates(
      '{"action":"transaction","data":{"amount":35000}}'
    );
    expect(out).toEqual(['{"action":"transaction","data":{"amount":35000}}']);
  });

  it("returns empty for brace-less text", () => {
    expect(extractJsonCandidates("Maaf, tidak terbaca")).toEqual([]);
  });
});

describe("parseScanResponse", () => {
  it("parses fenced JSON with surrounding prose", () => {
    const parsed = parseScanResponse(
      'Hasil scan:\n```json\n{"action":"transaction","message":"ok","data":{"amount":1},"confidence":"high"}\n```\nSelesai.'
    );
    expect(parsed?.action).toBe("transaction");
    expect((parsed?.data as { amount: number })?.amount).toBe(1);
  });

  it("skips non-action objects and picks the real one", () => {
    const parsed = parseScanResponse(
      '{"note": 1} lalu {"action":"chat","message":"halo"}'
    );
    expect(parsed?.action).toBe("chat");
  });

  it("returns null when nothing parses", () => {
    expect(parseScanResponse("tidak ada json di sini")).toBeNull();
  });
});
