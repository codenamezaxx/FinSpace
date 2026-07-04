"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type AiQueueItem } from "@/lib/db";

export function useAiQueue() {
  const pendingItems = useLiveQuery(() =>
    db.ai_queue.orderBy("created_at").toArray()
  );

  const addToQueue = async (
    inputType: AiQueueItem["input_type"],
    payload: string
  ) => {
    const created_at = Date.now();
    const queue_id = await db.ai_queue.add({ input_type: inputType, payload, created_at });
    return queue_id;
  };

  const removeFromQueue = async (queue_id: string) => {
    await db.ai_queue.delete(queue_id);
  };

  const clearQueue = async () => {
    await db.ai_queue.clear();
  };

  const getQueueCount = async (): Promise<number> => {
    return db.ai_queue.count();
  };

  return {
    pendingItems: pendingItems ?? [],
    loading: pendingItems === undefined,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueueCount,
  };
}
