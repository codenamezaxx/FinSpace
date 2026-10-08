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

  it("never shows the previous session's messages after switching", async () => {
    await db.open();
    for (const [sid, word] of [
      ["fnn_swap_A", "alpha"],
      ["fnn_swap_B", "beta"],
    ] as const) {
      await db.finny_sessions.put({
        id: sid,
        title: word,
        createdAt: 1,
        updatedAt: 1,
      });
      await db.finny_messages.bulkPut([
        {
          id: `Fnn_${sid}_u`,
          sessionId: sid,
          role: "user",
          content: `${word} user`,
          createdAt: 2,
        },
        {
          id: `Fnn_${sid}_a`,
          sessionId: sid,
          role: "assistant",
          content: `${word} assistant`,
          createdAt: 3,
        },
      ]);
    }

    const { result, rerender } = renderHook(
      ({ sid }: { sid: string }) => useFinnyChat({ sessionId: sid, persist: true }),
      { initialProps: { sid: "fnn_swap_A" } }
    );
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual([
        "alpha user",
        "alpha assistant",
      ])
    );

    rerender({ sid: "fnn_swap_B" });
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual([
        "beta user",
        "beta assistant",
      ])
    );
    // …and switching back restores A (no cross-contamination either way)
    rerender({ sid: "fnn_swap_A" });
    await waitFor(() =>
      expect(result.current.messages.map((m) => m.content)).toEqual([
        "alpha user",
        "alpha assistant",
      ])
    );

    await db.finny_messages
      .where("sessionId")
      .anyOf(["fnn_swap_A", "fnn_swap_B"])
      .delete();
    await db.finny_sessions.bulkDelete(["fnn_swap_A", "fnn_swap_B"]);
    db.close();
  }, 30000);

  it("unsends a user message: removes bubbles, refills text, cleans the db", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: streamOf(
        JSON.stringify({ action: "chat", message: "ok noted", confidence: "high" })
      ),
    }) as unknown as typeof fetch;
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    await db.open();
    const deleted: string[] = [];
    const { result } = renderHook(() =>
      useFinnyChat({
        persist: true,
        onSessionDeleted: (id) => deleted.push(id),
      })
    );
    await act(async () => {
      await result.current.sendMessage("tolong batalkan ini");
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toHaveLength(2);
    const sid = result.current.activeSessionId!;

    let refilled: string | null | undefined;
    await act(async () => {
      refilled = await result.current.unsendMessage(result.current.messages[0].id);
    });

    // bubbles gone, text returned for the input
    expect(refilled).toBe("tolong batalkan ini");
    expect(result.current.messages).toHaveLength(0);
    // db rows gone, emptied session row deleted + reported
    expect(
      await db.finny_messages.where("sessionId").equals(sid).count()
    ).toBe(0);
    expect(await db.finny_sessions.get(sid)).toBeUndefined();
    expect(deleted).toEqual([sid]);
    expect(result.current.activeSessionId).toBeNull();
    db.close();
  }, 30000);

  it("unsend returns null for unknown ids", async () => {
    await db.open();
    const { result } = renderHook(() => useFinnyChat({ persist: true }));
    let out: string | null | undefined;
    await act(async () => {
      out = await result.current.unsendMessage("nope");
    });
    expect(out).toBeNull();
    db.close();
  }, 30000);
});
