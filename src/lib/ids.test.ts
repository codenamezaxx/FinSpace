import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import {
  newTransactionId,
  newAssetId,
  newLiabilityId,
  newDebtId,
  newNotificationId,
  newAiQueueId,
  newFinnySessionId,
  newFinnyUserMessageId,
  newFinnyAssistantMessageId,
  deletedPresetKey,
  DELETED_PRESET_PREFIX,
} from "./ids";

/**
 * Regression guard for Dexie Cloud `@` primary keys: every generator below
 * must produce an id its table ACCEPTS (ConstraintError otherwise — which
 * used to silently break finny sessions, liabilities, the offline queue
 * and the deleted-preset guard).
 */
describe("ids", () => {
  it("round-trips one row per table", async () => {
    const { db } = await import("./db");
    await db.open();

    const txId = newTransactionId();
    await db.transactions.add({
      id: txId,
      type: "expense",
      amount: 1,
      category: "Kebutuhan",
      merchant: "m",
      payment_method: "Tunai",
      timestamp: 1,
    });

    const assId = newAssetId();
    await db.assets.put({
      id: assId,
      name: "n",
      amount: 1,
      type: "liquid",
      createdAt: 1,
    });

    const liaId = newLiabilityId();
    await db.liabilities.put({ id: liaId, name: "n", amount: 1, createdAt: 1 });

    const dbtId = newDebtId();
    await db.debts.put({
      id: dbtId,
      name: "n",
      totalAmount: 1,
      paidAmount: 0,
      dueDate: 1,
      createdAt: 1,
    });

    const ntfId = newNotificationId();
    await db.notifications.add({
      id: ntfId,
      type: "reminder",
      title: "t",
      message: "m",
      read: 0,
      createdAt: 1,
    });

    const aqId = newAiQueueId();
    await db.ai_queue.add({
      queue_id: aqId,
      input_type: "text_chat",
      payload: "x",
      created_at: 1,
    });

    const sesId = newFinnySessionId();
    await db.finny_sessions.add({
      id: sesId,
      title: "t",
      createdAt: 1,
      updatedAt: 1,
    });

    const umId = newFinnyUserMessageId();
    const amId = newFinnyAssistantMessageId();
    // App-shaped rows: optional keys present-but-undefined + real AI payload
    await db.finny_messages.bulkPut([
      {
        id: umId,
        sessionId: sesId,
        role: "user",
        content: "hi",
        action: undefined,
        data: undefined,
        missingFields: undefined,
        confidence: undefined,
        createdAt: 2,
      },
      {
        id: amId,
        sessionId: sesId,
        role: "assistant",
        content: "hello",
        action: "transaction",
        data: {
          type: "expense",
          amount: 25000,
          merchant: "Kopi",
          category: "Kebutuhan",
          pocket_name: "Tunai",
        },
        missingFields: undefined,
        confidence: "high",
        createdAt: 3,
      },
    ]);
    const msgs = await db.finny_messages
      .where("sessionId")
      .equals(sesId)
      .sortBy("createdAt");
    expect(msgs.map((m) => m.id)).toEqual([umId, amId]);

    const marker = deletedPresetKey("Gopay");
    expect(marker.startsWith("app")).toBe(true);
    expect(marker.startsWith(DELETED_PRESET_PREFIX)).toBe(true);
    await db.app_meta.put({ key: marker, value: "1" });
    const found = await db.app_meta
      .where("key")
      .startsWith(DELETED_PRESET_PREFIX)
      .primaryKeys();
    expect(found).toContain(marker);

    // cleanup
    await db.transactions.delete(txId);
    await db.assets.delete(assId);
    await db.liabilities.delete(liaId);
    await db.debts.delete(dbtId);
    await db.notifications.delete(ntfId);
    await db.ai_queue.delete(aqId);
    await db.finny_messages.where("sessionId").equals(sesId).delete();
    await db.finny_sessions.delete(sesId);
    await db.app_meta.delete(marker);
    db.close();
  }, 30000);
});
