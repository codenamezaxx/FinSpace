// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFinnyScan } from "./useFinnyScan";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useFinnyScan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("starts with null result, not loading, no error", () => {
    const { result } = renderHook(() => useFinnyScan());
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading during scan", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ action: "chat", message: "ok", confidence: "high" }), { status: 200 })
    );

    const { result } = renderHook(() => useFinnyScan());

    act(() => {
      result.current.scanImage("data:image/jpeg;base64,test");
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("returns parsed result on success", async () => {
    const aiResponse = {
      action: "transaction",
      message: "Oke, catat ya!",
      data: { type: "expense", amount: 35000, merchant: "Indomaret", category: "Belanja", payment_method: "Cash", pocket_name: "Tunai" },
      confidence: "high",
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(aiResponse), { status: 200 })
    );

    const { result } = renderHook(() => useFinnyScan());

    await act(async () => {
      await result.current.scanImage("data:image/jpeg;base64,test");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result?.action).toBe("transaction");
    expect(result.current.result?.data?.amount).toBe(35000);
    expect(result.current.error).toBeNull();
  });

  it("handles API error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFinnyScan());

    await act(async () => {
      await result.current.scanImage("data:image/jpeg;base64,test");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.result).toBeNull();
  });

  it("handles 429 rate limit as result", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ action: "chat", message: "Terlalu banyak permintaan!" }),
        { status: 429 }
      )
    );

    const { result } = renderHook(() => useFinnyScan());

    await act(async () => {
      await result.current.scanImage("data:image/jpeg;base64,test");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result?.action).toBe("chat");
    expect(result.current.result?.message).toBe("Terlalu banyak permintaan!");
    expect(result.current.error).toBeNull();
  });

  it("reset clears result and error", () => {
    const { result } = renderHook(() => useFinnyScan());

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sends image in request body", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ action: "chat", message: "ok", confidence: "high" }), { status: 200 })
    );

    const { result } = renderHook(() => useFinnyScan());

    await act(async () => {
      await result.current.scanImage("data:image/jpeg;base64,test123");
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/ai/scan",
      expect.objectContaining({
        body: expect.stringContaining("test123"),
      })
    );
  });
});
