import { describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";
import { renderHook, waitFor, act } from "@testing-library/react";
import { db } from "@/lib/db";
import { useFinnyChat } from "./useFinnyChat";

function streamOf(content: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(content));
      controller.close();
    },
  });
}

describe("persist scratch", () => {
  it("seeds messages for an existing session", async () => {
    await db.open();
    await db.finny_sessions.put({
      id: "fnn_seed_1",
      title: "t",
      createdAt: 1,
      updatedAt: 1,
    });
    await db.finny_messages.bulkPut([
      {
        id: "Fnnu_1",
        sessionId: "fnn_seed_1",
        role: "user",
        content: "hi",
        createdAt: 2,
      },
      {
        id: "Fnna_1",
        sessionId: "fnn_seed_1",
        role: "assistant",
        content: "hello",
        createdAt: 3,
      },
    ]);

    const { result } = renderHook(() =>
      useFinnyChat({ sessionId: "fnn_seed_1", persist: true })
    );
    await waitFor(() => expect(result.current.messages).toHaveLength(2), {
      timeout: 5000,
    });
    expect(result.current.messages[0].content).toBe("hi");

    await db.finny_messages.where("sessionId").equals("fnn_seed_1").delete();
    await db.finny_sessions.delete("fnn_seed_1");
    db.close();
  }, 30000);

  it("persists a full turn with Dexie-valid ids (regression: literal id bug)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: streamOf(
        JSON.stringify({ action: "chat", message: "halo juga", confidence: "high" })
      ),
    }) as unknown as typeof fetch;
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    await db.open();
    const { result } = renderHook(() => useFinnyChat({ persist: true }));
    await act(async () => {
      await result.current.sendMessage("tes tulis");
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const sid = result.current.activeSessionId;
    expect(sid).toMatch(/^fnn/);
    const rows = await db.finny_messages
      .where("sessionId")
      .equals(sid!)
      .sortBy("createdAt");
    // Both user + assistant messages must be durably stored…
    expect(rows).toHaveLength(2);
    // …with table-compliant ids (Dexie Cloud ConstraintError otherwise)
    expect(rows.every((r) => r.id.startsWith("Fnn"))).toBe(true);
    expect(rows[0].role).toBe("user");
    expect(rows[1].role).toBe("assistant");

    await db.finny_messages.where("sessionId").equals(sid!).delete();
    await db.finny_sessions.delete(sid!);
    db.close();
  }, 30000);
});
