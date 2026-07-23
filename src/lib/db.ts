import Dexie, { type EntityTable } from "dexie";
import dexieCloud from "dexie-cloud-addon";
import type { Pocket } from "./pocket";
import type { AssetEntry, LiabilityEntry, DebtEntry } from "./netWorth";
export type { Pocket };

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  merchant: string;
  payment_method: string;
  timestamp: number;
  transferId?: string;
  pocketId?: string | null;
  // Dexie Cloud auto-fields (managed internally): owner, realmId
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
  assets!: EntityTable<AssetEntry, "id">;
  liabilities!: EntityTable<LiabilityEntry, "id">;
  debts!: EntityTable<DebtEntry, "id">;

  constructor() {
    super("FinSpaceDB", { addons: [dexieCloud] });

    this.version(1).stores({
      transactions: "id, type, category, timestamp, sync_status",
      ai_queue: "queue_id, input_type, created_at",
    });

    this.version(2).stores({
      transactions: "id, type, category, timestamp, sync_status, pocketId",
      pockets: "id, category, sortOrder",
      ai_queue: "queue_id, input_type, created_at",
    });

    // v3: @id prefix untuk Dexie Cloud, hapus sync_status dari index
    this.version(3).stores({
      transactions: "@id, type, category, timestamp, pocketId",
      pockets: "@id, category, sortOrder",
      ai_queue: "@queue_id, input_type, created_at",
    });

    // v4: wealth data — assets, liabilities, debts (migrate from localStorage to Dexie Cloud)
    this.version(4).stores({
      transactions: "@id, type, category, timestamp, pocketId",
      pockets: "@id, category, sortOrder",
      ai_queue: "@queue_id, input_type, created_at",
      assets: "@id, type, createdAt",
      liabilities: "@id, createdAt",
      debts: "@id, createdAt",
    });

    this.cloud.configure({
      databaseUrl: process.env.NEXT_PUBLIC_DEXIE_CLOUD_URL!,
      requireAuth: false, // anonymous first, login kapan saja
    });
  }
}

export const db = new FinSpaceDB();

export async function migrateWealthFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  const MIGRATED_KEY = "finspace_wealth_migrated_v4";
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const assetsRaw = localStorage.getItem("finspace_assets");
    const liabilitiesRaw = localStorage.getItem("finspace_liabilities");
    const debtsRaw = localStorage.getItem("finspace_debts");

    const assets: AssetEntry[] = assetsRaw ? JSON.parse(assetsRaw) : [];
    const liabilities: LiabilityEntry[] = liabilitiesRaw ? JSON.parse(liabilitiesRaw) : [];
    const debts: DebtEntry[] = debtsRaw ? JSON.parse(debtsRaw) : [];

    if (assets.length > 0) await db.assets.bulkPut(assets);
    if (liabilities.length > 0) await db.liabilities.bulkPut(liabilities);
    if (debts.length > 0) await db.debts.bulkPut(debts);

    localStorage.setItem(MIGRATED_KEY, "1");
    console.log(`[FinSpace] Migrated wealth data: ${assets.length} assets, ${liabilities.length} liabilities, ${debts.length} debts`);
  } catch (err) {
    console.error("[FinSpace] Wealth migration failed:", err);
  }
}
