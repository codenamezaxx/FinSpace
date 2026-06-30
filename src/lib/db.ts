import Dexie, { type EntityTable } from "dexie";
import type { Pocket } from "./pocket";
export type { Pocket };

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  merchant: string;
  payment_method: string;
  timestamp: number;
  sync_status: "pending" | "synced" | "failed";
  pocketId?: string | null;
}

export interface AiQueueItem {
  queue_id: string;
  input_type: "text_chat" | "image_blob";
  payload: string;
  created_at: number;
}

export class FinSpaceDB extends Dexie {
  transactions!: EntityTable<Transaction, "id">;
  ai_queue!: EntityTable<AiQueueItem, "queue_id">;
  pockets!: EntityTable<Pocket, "id">;

  constructor() {
    super("FinSpaceDB");
    this.version(1).stores({
      transactions: "id, type, category, timestamp, sync_status",
      ai_queue: "queue_id, input_type, created_at",
    });
    this.version(2).stores({
      transactions: "id, type, category, timestamp, sync_status, pocketId",
      pockets: "id, category, sortOrder",
      ai_queue: "queue_id, input_type, created_at",
    });
  }
}

export const db = new FinSpaceDB();
