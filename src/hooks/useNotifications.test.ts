import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNotifications } from "./useNotifications";
import { db } from "@/lib/db";

describe("useNotifications", () => {
  beforeEach(async () => {
    await db.notifications.clear();
  });

  it("returns empty list initially", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("adds a notification and shows it", async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.addNotification({
        type: "transaction",
        title: "Pengeluaran Baru",
        message: "Rp15.000 untuk Nasi Goreng",
      });
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Pengeluaran Baru");
    expect(result.current.notifications[0].read).toBe(0);
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });
  });

  it("marks a notification as read", async () => {
    const { result } = renderHook(() => useNotifications());
    let id = "";
    await act(async () => {
      id = await result.current.addNotification({
        type: "transaction",
        title: "Test",
        message: "Test message",
      });
    });
    await act(async () => {
      await result.current.markAsRead(id);
    });
    await waitFor(() => {
      expect(result.current.notifications[0].read).toBe(1);
    });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("marks all as read", async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.addNotification({ type: "transaction", title: "A", message: "Msg A" });
      await result.current.addNotification({ type: "overspending", title: "B", message: "Msg B" });
    });
    await act(async () => {
      await result.current.markAllAsRead();
    });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
    await waitFor(() => {
      expect(result.current.notifications.every((n) => n.read === 1)).toBe(true);
    });
  });

  it("clearAll removes all notifications", async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.addNotification({ type: "transaction", title: "A", message: "Msg" });
    });
    await act(async () => {
      await result.current.clearAll();
    });
    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
    });
  });
});
