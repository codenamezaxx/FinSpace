import { db } from "./db";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export type SyncListener = (status: SyncStatus, message?: string) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private _status: SyncStatus = "idle";
  private syncing = false;

  get status(): SyncStatus {
    return this._status;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(status: SyncStatus, message?: string) {
    this._status = status;
    this.listeners.forEach((fn) => fn(status, message));
  }

  /**
   * Process all pending items in the ai_queue.
   * In a real app, this would POST to an AI API.
   * For now, it simulates processing and removes items.
   */
  async syncPending(): Promise<void> {
    if (this.syncing) return;
    if (typeof window === "undefined" || !navigator.onLine) {
      this.notify("offline", "No internet connection");
      return;
    }

    this.syncing = true;
    this.notify("syncing", "Syncing pending items...");

    try {
      const pending = await db.ai_queue.orderBy("created_at").toArray();

      if (pending.length === 0) {
        this.notify("idle");
        this.syncing = false;
        return;
      }

      // Process each item
      for (const item of pending) {
        // TODO: replace with actual API call:
        // await fetch("/api/ai/process", { method: "POST", body: JSON.stringify(item) })

        // Simulate processing delay
        await new Promise((r) => setTimeout(r, 100));

        // Remove processed item
        await db.ai_queue.delete(item.queue_id);
      }

      this.notify("idle", `Synced ${pending.length} items`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      this.notify("error", message);
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Initialize listeners for online/offline events.
   * Automatically syncs when coming back online.
   */
  init(): void {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      this.syncPending();
    };

    const handleOffline = () => {
      this.notify("offline", "Connection lost — items queued for later sync");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check: sync if online
    if (navigator.onLine) {
      this.syncPending();
    }
  }
}

export const syncManager = new SyncManager();
