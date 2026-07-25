import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { notifyTransaction, checkOverspending, checkCreditReminders } from "./notificationTriggers";

describe("notificationTriggers", () => {
  beforeEach(async () => {
    await db.notifications.clear();
  });

  describe("notifyTransaction", () => {
    it("creates a notification for expense transactions", async () => {
      const txn = { id: "tx1", type: "expense", amount: -15000, merchant: "Nasi Goreng", timestamp: Date.now() } as any;
      await notifyTransaction(txn);
      const notifs = await db.notifications.toArray();
      expect(notifs).toHaveLength(1);
      expect(notifs[0].type).toBe("transaction");
      expect(notifs[0].title).toBe("Pengeluaran Baru");
    });

    it("skips income transactions", async () => {
      const txn = { id: "tx2", type: "income", amount: 5000000, timestamp: Date.now() } as any;
      await notifyTransaction(txn);
      const notifs = await db.notifications.toArray();
      expect(notifs).toHaveLength(0);
    });
  });

  describe("checkOverspending", () => {
    it("creates notification when pocket exceeds budget", async () => {
      const now = Date.now();
      const txns = [
        { id: "t1", type: "expense", amount: -300000, pocketId: "p1", timestamp: now },
      ] as any[];
      const budgets = [{ pocketId: "p1", category: "Makanan", budget: 200000 }];
      const created = await checkOverspending(txns, budgets);
      expect(created).toHaveLength(1);
      const notifs = await db.notifications.toArray();
      expect(notifs[0].type).toBe("overspending");
      expect(notifs[0].message).toContain("Makanan");
    });

    it("does not create notification when within budget", async () => {
      const txns = [
        { id: "t1", type: "expense", amount: -50000, pocketId: "p1", timestamp: Date.now() },
      ] as any[];
      const budgets = [{ pocketId: "p1", category: "Makanan", budget: 200000 }];
      const created = await checkOverspending(txns, budgets);
      expect(created).toHaveLength(0);
    });
  });

  describe("checkCreditReminders", () => {
    it("creates reminder when due date is within 7 days", async () => {
      // Set timestamp to 20 days ago so that estimated due date is 5 days from now
      const twentyDaysAgo = Date.now() - 20 * 24 * 60 * 60 * 1000;
      const txns = [
        { id: "c1", type: "expense", amount: -500000, category: "credit_card", timestamp: twentyDaysAgo },
      ] as any[];
      const created = await checkCreditReminders(txns);
      // Due date is ~5 days from now, within 7 days
      expect(created.length).toBeGreaterThan(0);
      const notifs = await db.notifications.toArray();
      if (created.length > 0) {
        expect(notifs[0].type).toBe("credit_reminder");
        expect(notifs[0].message).toContain("hari");
      }
    });

    it("does not create reminder if due date is far", async () => {
      const justToday = Date.now();
      const txns = [
        { id: "c2", type: "expense", amount: -500000, category: "credit_card", timestamp: justToday },
      ] as any[];
      const created = await checkCreditReminders(txns);
      // Due date is ~25 days from now, beyond 7 days
      expect(created).toHaveLength(0);
    });
  });
});
