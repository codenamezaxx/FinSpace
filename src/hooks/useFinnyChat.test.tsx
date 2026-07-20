// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFinnyChat } from "./useFinnyChat";

const mockFetch = vi.fn();
global.fetch = mockFetch;

Object.defineProperty(navigator, "onLine", { value: true, writable: true });

vi.mock("@/lib/db", () => ({
  db: {
    ai_queue: {
      add: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

function createMockStream(content: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(content));
      controller.close();
    },
  });
}

describe("useFinnyChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("starts with empty messages and not loading", () => {
    const { result } = renderHook(() => useFinnyChat());
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("detects offline status", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    const { result } = renderHook(() => useFinnyChat());
    expect(result.current.isOffline).toBe(true);
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
  });

  it("queues message when offline and returns offline response", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    const { result } = renderHook(() => useFinnyChat());

    await act(async () => {
      await result.current.sendMessage("beli bakso 35rb");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("beli bakso 35rb");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toContain("antrean");
    expect(result.current.isOffline).toBe(true);
    expect(result.current.isLoading).toBe(false);

    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
  });

  it("sends message and receives AI response", async () => {
    const aiResponse = JSON.stringify({
      action: "transaction",
      message: "Oke, catat ya!",
      data: {
        type: "expense",
        amount: 35000,
        merchant: "Bakso",
        category: "Makanan & Minuman",
        payment_method: "Cash",
      },
      confidence: "high",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: createMockStream(aiResponse),
    });

    const { result } = renderHook(() => useFinnyChat());

    await act(async () => {
      await result.current.sendMessage("beli bakso 35rb");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].action).toBe("transaction");
    expect(result.current.messages[1].data).toBeDefined();
  });

  it("handles API error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFinnyChat());

    await act(async () => {
      await result.current.sendMessage("halo");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it("clearMessages resets state", () => {
    const { result } = renderHook(() => useFinnyChat());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});
