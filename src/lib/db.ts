import Dexie, { type EntityTable } from "dexie";

export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  merchant: string;
  payment_method: string;
  timestamp: number;
  sync_status: "synced" | "pending" | "local_only";
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

  constructor() {
    super("FinSpaceDB");
    this.version(1).stores({
      transactions: "id, type, category, timestamp, sync_status",
      ai_queue: "queue_id, input_type, created_at",
    });
  }
}

export const db = new FinSpaceDB();
