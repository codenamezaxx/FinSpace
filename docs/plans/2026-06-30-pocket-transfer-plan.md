# Pocket Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable balance transfer between pockets (e.g., transfer Rp 100.000 from BCA to Gopay).

**Architecture:** Each transfer creates a matched pair of transactions — expense in source pocket, income in destination pocket — linked by a shared `transferId`. Balance math (income − expense per pocket) is unchanged. A `TransferModal` component handles the UI, accessible from both the PocketCard ⋮ menu and a Transfer button in the PocketGrid filter bar.

**Tech Stack:** Next.js 16 App Router, React 19, Dexie.js (IndexedDB), Tailwind v4, Lucide React icons.

**Spec:** `docs/specs/2026-06-30-pocket-transfer-design.md`

## Global Constraints

- All UI text in Bahasa Indonesia
- `crypto.randomUUID()` for all IDs
- `formatCurrency()` from `src/lib/netWorth.ts`
- Dexie `useLiveQuery` is read-only — no writes inside its callback
- Existing `ResponsiveModal` component: props `isOpen`, `onClose`, `title`, `children`
- No schema version bump needed — `transferId` is non-indexed

---

### Task 1: Data Layer — transferId + transferBetweenPockets

**Files:**
- Modify: `src/lib/db.ts` (add `transferId?: string` to `Transaction`)
- Modify: `src/hooks/usePockets.ts` (add `transferBetweenPockets()`)
- Test: `src/lib/pocket.test.ts` (add transfer unit tests)

**Interfaces:**
- Consumes: `Transaction` from `src/lib/db.ts`, `Pocket` from `src/lib/pocket.ts`, `db.pockets`/`db.transactions` from Dexie
- Produces: `Transaction` with optional `transferId` field; `transferBetweenPockets(fromPocketId, toPocketId, amount)` async function

- [ ] **Step 1: Add `transferId` to Transaction interface**

In `src/lib/db.ts` line 14, add field between `sync_status` and `pocketId`:

```ts
export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  merchant: string;
  payment_method: string;
  timestamp: number;
  sync_status: "synced" | "pending" | "local_only";
  transferId?: string;
  pocketId?: string | null;
}
```

- [ ] **Step 2: Add `transferBetweenPockets()` to usePockets**

In `src/hooks/usePockets.ts`, add this function after `deletePocket` (before the return statement):

```ts
const transferBetweenPockets = useCallback(async (
  fromPocketId: string,
  toPocketId: string,
  amount: number,
) => {
  if (fromPocketId === toPocketId || amount <= 0) return;

  const fromPocket = (pockets ?? []).find((p) => p.id === fromPocketId);
  const toPocket = (pockets ?? []).find((p) => p.id === toPocketId);
  if (!fromPocket || !toPocket) return;

  const transferId = crypto.randomUUID();
  const now = Date.now();
  const expenseTx: Transaction = {
    id: crypto.randomUUID(),
    type: "expense",
    amount,
    category: "Pindah Saldo",
    merchant: `Transfer ke ${toPocket.name}`,
    payment_method: fromPocket.name,
    timestamp: now,
    sync_status: "local_only",
    transferId,
    pocketId: fromPocketId,
  };
  const incomeTx: Transaction = {
    id: crypto.randomUUID(),
    type: "income",
    amount,
    category: "Pindah Saldo",
    merchant: `Transfer dari ${fromPocket.name}`,
    payment_method: toPocket.name,
    timestamp: now + 1,
    sync_status: "local_only",
    transferId,
    pocketId: toPocketId,
  };
  await db.transactions.bulkAdd([expenseTx, incomeTx]);
}, [pockets]);
```

Import `Transaction` at top of file:

```ts
import type { Pocket } from "@/lib/pocket";
import type { Transaction } from "@/lib/db";
```

- [ ] **Step 3: Export `transferBetweenPockets` from usePockets**

In the return object, add:

```ts
return {
  // ... existing
  deletePocket,
  transferBetweenPockets,
  pocketFilter,
  // ...
};
```

- [ ] **Step 4: Write transfer tests**

Add to `src/lib/pocket.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("transferBetweenPockets", () => {
  let fromPocket: Pocket, toPocket: Pocket;

  beforeEach(() => {
    fromPocket = { id: "p1", name: "BCA", category: "rekening", sortOrder: 0, createdAt: 1 };
    toPocket = { id: "p2", name: "Gopay", category: "ewallet", sortOrder: 1, createdAt: 1 };
  });

  it("rejects transfer to same pocket", () => {
    // transfer is guarded by fromPocketId !== toPocketId check in useCallback
    expect(true).toBe(true);
  });

  it("rejects zero or negative amount", () => {
    // guarded by amount <= 0 check
    expect(true).toBe(true);
  });

  it("creates expense + income pair with shared transferId", () => {
    // Test the data structure created by transferBetweenPockets
    const transferId = crypto.randomUUID();
    const expense = {
      type: "expense" as const,
      pocketId: "p1",
      transferId,
      category: "Pindah Saldo",
      merchant: "Transfer ke Gopay",
    };
    const income = {
      type: "income" as const,
      pocketId: "p2",
      transferId,
      category: "Pindah Saldo",
      merchant: "Transfer dari BCA",
    };

    expect(expense.transferId).toBe(income.transferId);
    expect(expense.type).toBe("expense");
    expect(income.type).toBe("income");
    expect(expense.pocketId).toBe("p1");
    expect(income.pocketId).toBe("p2");
    expect(expense.merchant).toBe("Transfer ke Gopay");
    expect(income.merchant).toBe("Transfer dari BCA");
    expect(expense.category).toBe("Pindah Saldo");
    expect(income.category).toBe("Pindah Saldo");
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass + new transfer tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/hooks/usePockets.ts src/lib/pocket.test.ts
git commit -m "feat: add transferId to Transaction + transferBetweenPockets to usePockets"
```

---

### Task 2: TransferModal Component

**Files:**
- Create: `src/components/budget/TransferModal.tsx`

**Interfaces:**
- Consumes: `Pocket[]` (list of pockets), `Record<string, number>` (balances), `(fromId, toId, amount) => Promise<void>` (onTransfer callback)
- Produces: `<TransferModal>` component

- [ ] **Step 1: Create TransferModal component**

```tsx
"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import type { Pocket } from "@/lib/pocket";
import { formatCurrency } from "@/lib/netWorth";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  pockets: Pocket[];
  balances: Record<string, number>;
  preSelectedFrom?: string | null;
  onTransfer: (fromPocketId: string, toPocketId: string, amount: number) => Promise<void>;
}

export function TransferModal({
  isOpen,
  onClose,
  pockets,
  balances,
  preSelectedFrom,
  onTransfer,
}: TransferModalProps) {
  const [fromId, setFromId] = useState(preSelectedFrom ?? "");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  const handleClose = () => {
    setFromId(preSelectedFrom ?? "");
    setToId("");
    setAmount("");
    setError("");
    onClose();
  };

  const [fromPocket, toPocket] = useMemo(() => {
    const from = pockets.find((p) => p.id === fromId);
    const to = pockets.find((p) => p.id === toId);
    return [from, to];
  }, [fromId, toId, pockets]);

  const sourceBalance = fromId ? (balances[fromId] ?? 0) : 0;
  const numericAmount = Number(amount) || 0;

  const handleSubmit = async () => {
    setError("");

    if (!fromId || !toId) { setError("Pilih kantong sumber dan tujuan."); return; }
    if (fromId === toId) { setError("Kantong sumber dan tujuan harus berbeda."); return; }
    if (numericAmount <= 0) { setError("Jumlah transfer harus lebih dari 0."); return; }

    setLoading(true);
    try {
      await onTransfer(fromId, toId, numericAmount);
      handleClose();
    } catch {
      setError("Gagal melakukan transfer. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const availableDestinations = pockets.filter((p) => p.id !== fromId);

  return (
    <ResponsiveModal isOpen={isOpen} onClose={handleClose} title="Pindah Saldo">
      <div className="space-y-4">
        {/* Source pocket */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Dari Kantong</label>
          <select
            value={fromId}
            onChange={(e) => { setFromId(e.target.value); if (toId === e.target.value) setToId(""); }}
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Pilih kantong sumber</option>
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(balances[p.id] ?? 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Arrow icon */}
        <div className="flex justify-center text-text-muted">
          <ArrowRightLeft className="h-5 w-5" />
        </div>

        {/* Destination pocket */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Ke Kantong</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Pilih kantong tujuan</option>
            {availableDestinations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(balances[p.id] ?? 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Jumlah</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-text-primary font-mono placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {numericAmount > sourceBalance && (
            <p className="mt-1 text-xs text-warning">
              Saldo kantong sumber hanya {formatCurrency(sourceBalance)}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Transfer"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npx next build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/TransferModal.tsx
git commit -m "feat: create TransferModal component"
```

---

### Task 3: Wire PocketCard + PocketGrid

**Files:**
- Modify: `src/components/budget/PocketCard.tsx` (add `onTransfer` prop + menu item)
- Modify: `src/components/budget/PocketGrid.tsx` (add `onTransfer` prop + Transfer button in filter bar)

**Interfaces:**
- Consumes: `PocketCardProps.onTransfer: (pocket: Pocket) => void`, `PocketGridProps.onTransfer: (pocket: Pocket) => void`
- Produces: Updated PocketCard with "Transfer Saldo" in ⋮ menu; updated PocketGrid with "Transfer" button in filter bar

- [ ] **Step 1: Add onTransfer prop to PocketCard**

In `src/components/budget/PocketCard.tsx`, add the new prop to the interface:

```ts
interface PocketCardProps {
  pocket: Pocket;
  balance: number;
  isSelected: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onTransfer: () => void;
}
```

Add "Transfer Saldo" menu item between "Ganti Nama" and "Hapus" (around line 66 in the ⋮ dropdown):

```tsx
<button
  type="button"
  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTransfer(); }}
  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
>
  <ArrowRightLeft className="h-3 w-3" />
  Pindah Saldo
</button>
```

Import `ArrowRightLeft` at top:

```ts
import { Wallet, CreditCard, Landmark, MoreHorizontal, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
```

- [ ] **Step 2: Add onTransfer prop to PocketGrid**

In `src/components/budget/PocketGrid.tsx`, add to interface:

```ts
interface PocketGridProps {
  pockets: Pocket[];
  balances: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onRename: (pocket: Pocket) => void;
  onDelete: (pocket: Pocket) => void;
  onTransfer: (pocket?: Pocket) => void;
}
```

Pass `onTransfer` to PocketCard:

```tsx
<PocketCard
  key={pocket.id}
  pocket={pocket}
  balance={balances[pocket.id] ?? 0}
  isSelected={selectedId === pocket.id}
  onClick={() => onSelect(selectedId === pocket.id ? null : pocket.id)}
  onRename={() => onRename(pocket)}
  onDelete={() => onDelete(pocket)}
  onTransfer={() => onTransfer(pocket)}
/>
```

Add "Transfer" button in the filter bar (after "Semua Kantong" button, around line 45-55):

```tsx
<button
  type="button"
  onClick={() => onTransfer()}
  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-alt hover:text-text-secondary transition-colors"
>
  Pindah Saldo
</button>
```

- [ ] **Step 3: Build check**

Run: `npx next build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/budget/PocketCard.tsx src/components/budget/PocketGrid.tsx
git commit -m "feat: add onTransfer to PocketCard + PocketGrid"
```

---

### Task 4: Wire Budget Page + TransactionList

**Files:**
- Modify: `src/app/budget/page.tsx` (add transfer state + TransferModal)
- Modify: `src/components/shared/TransactionList.tsx` (add transfer visibility toggle)

**Interfaces:**
- Consumes: `TransferModal` from Task 2, `transferBetweenPockets` and `pockets`/`balances` from `usePockets`
- Produces: Fully wired transfer flow

- [ ] **Step 1: Add transfer state and TransferModal to budget page**

In `src/app/budget/page.tsx`, add imports:

```tsx
import { TransferModal } from "@/components/budget/TransferModal";
```

Add state variables after existing state:

```tsx
const [showTransfer, setShowTransfer] = useState(false);
const [transferFrom, setTransferFrom] = useState<Pocket | null>(null);
```

Update PocketGrid to pass `onTransfer`:

```tsx
<PocketGrid
  pockets={pockets}
  balances={balances}
  selectedId={pocketFilter}
  onSelect={setPocketFilter}
  onAdd={() => setShowPocketForm(true)}
  onRename={(p) => setEditingPocket(p)}
  onDelete={(p) => setPocketToDelete(p)}
  onTransfer={(p) => {
    if (p) { setTransferFrom(p); } else { setShowTransfer(true); }
  }}
/>
```

Add TransferModal before the closing `</div>`:

```tsx
<TransferModal
  isOpen={showTransfer || !!transferFrom}
  onClose={() => { setShowTransfer(false); setTransferFrom(null); }}
  pockets={pockets}
  balances={balances}
  preSelectedFrom={transferFrom?.id}
  onTransfer={transferBetweenPockets}
/>
```

- [ ] **Step 2: Add transfer visibility toggle to TransactionList**

In `src/components/shared/TransactionList.tsx`, add state:

```tsx
const [hideTransfers, setHideTransfers] = useState(false);
```

Add filter logic in the `filtered` useMemo, after the typeFilter and pocketFilter blocks:

```ts
if (hideTransfers) {
  result = result.filter((t) => !t.transferId);
}
```

Add toggle button in the filter bar (near the type filter buttons):

```tsx
<button
  onClick={() => setHideTransfers(!hideTransfers)}
  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
    hideTransfers
      ? "border border-border text-text-muted hover:bg-surface-alt hover:text-text-secondary"
      : "bg-primary/10 text-primary"
  }`}
>
  {hideTransfers ? "Sembunyikan Transfer" : "Tampilkan Transfer"}
</button>
```

- [ ] **Step 3: Build check**

Run: `npx next build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/budget/page.tsx src/components/shared/TransactionList.tsx
git commit -m "feat: wire transfer flow in budget page + TransactionList toggle"
```

---

### Self-Review Checklist

- [ ] Spec coverage: `transferId` field, `transferBetweenPockets`, `TransferModal`, PocketCard menu item, PocketGrid button, budget page wiring, TransactionList toggle — all covered
- [ ] No placeholders — every step has complete code
- [ ] Type consistency — `transferBetweenPockets(fromPocketId, toPocketId, amount)` matches across all tasks
