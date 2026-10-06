"use client";

import { useCallback } from "react";
import type { Pocket } from "@/lib/pocket";
import { usePockets } from "./usePockets";
import {
  newAssetId,
  newDebtId,
  newLiabilityId,
  newTransactionId,
} from "@/lib/ids";

type AddPocketFn = ReturnType<typeof usePockets>["addPocket"];

/**
 * Shared Finny "save AI result" executor, used by both the floating
 * FinnySheet and the full roomchat page. Persists transaction / asset /
 * liability / debt / pocket actions proposed by the assistant.
 */
export function useFinnySave(
  pocketEnts: Pocket[],
  addPocket: AddPocketFn,
  transferFn?: (fromId: string, toId: string, amount: number) => Promise<void>
) {
  const handleSave = useCallback(
    async (action: string, data: Record<string, unknown>) => {
      switch (action) {
        case "transfer_pocket": {
          if (!transferFn) throw new Error("Transfer tidak didukung di sini");
          const fromName = ((data.from_pocket as string) || "").toLowerCase();
          const toName = ((data.to_pocket as string) || "").toLowerCase();
          const from = pocketEnts.find((p) => p.name.toLowerCase() === fromName);
          const to = pocketEnts.find((p) => p.name.toLowerCase() === toName);
          if (!from || !to) throw new Error("Kantong tidak ditemukan");
          await transferFn(from.id, to.id, data.amount as number);
          break;
        }
        case "transaction": {
          const { db } = await import("@/lib/db");
          const pocketName = (data.pocket_name as string) || "Tunai";
          const pocket = pocketEnts.find(
            (p) => p.name.toLowerCase() === pocketName.toLowerCase()
          ) ?? pocketEnts.find((p) => p.name === "Tunai");

            await db.transactions.add({
              id: newTransactionId(),
              type: data.type as "income" | "expense",
            amount: data.amount as number,
            category: data.category as string,
            merchant: data.merchant as string,
            payment_method: data.payment_method as string,
            pocketId: pocket?.id ?? null,
            timestamp: Date.now(),
          });
          break;
        }
        case "asset": {
          const { db } = await import("@/lib/db");
          await db.assets.put({
            id: newAssetId(),
            name: data.name as string,
            amount: data.amount as number,
            type: data.asset_type as "liquid" | "investment" | "property" | "other",
            createdAt: Date.now(),
          });
          break;
        }
        case "liability": {
          const { db } = await import("@/lib/db");
          await db.liabilities.put({
            id: newLiabilityId(),
            name: data.name as string,
            amount: data.amount as number,
            createdAt: Date.now(),
          });
          break;
        }
        case "debt": {
          const { db } = await import("@/lib/db");
          await db.debts.put({
            id: newDebtId(),
            name: data.name as string,
            totalAmount: data.totalAmount as number,
            paidAmount: (data.paidAmount as number) ?? 0,
            dueDate: data.dueDate
              ? new Date(data.dueDate as string).getTime()
              : Date.now() + 365 * 86400000,
            interestRate: (data.interestRate as number) ?? undefined,
            createdAt: Date.now(),
          });
          break;
        }
        case "create_pocket": {
          const name = data.name as string;
          if (!name?.trim()) throw new Error("Nama kantong harus diisi");
          const category = (data.category as "tunai" | "ewallet" | "rekening") ?? "ewallet";
          const pocketId = await addPocket(name.trim(), category);
          // Jika ada saldo awal, buat transaksi income untuk isi saldo
          const initialBalance = (data.initial_balance as number) ?? 0;
          if (initialBalance > 0) {
            const { db } = await import("@/lib/db");
            await db.transactions.add({
              id: newTransactionId(),
              type: "income",
              amount: initialBalance,
              category: "Lainnya",
              merchant: `Saldo awal ${name.trim()}`,
              payment_method: "Lainnya",
              pocketId,
              timestamp: Date.now(),
            });
          }
          break;
        }
      }
    },
    [pocketEnts, addPocket, transferFn]
  );

  return { handleSave };
}
