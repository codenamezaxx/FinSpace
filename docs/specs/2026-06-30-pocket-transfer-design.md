# Pocket Transfer — Balance Transfer Between Pockets

## Overview

Move balance between pockets (e.g., transfer Rp 100.000 from BCA to Gopay). Each transfer creates a matched pair of transactions: an expense in the source pocket and an income in the destination pocket, linked by a shared `transferId`.

## Data Model

Add one optional field to the existing `Transaction` type:

```ts
interface Transaction {
  // ... existing fields
  transferId?: string;  // non-indexed; shared across source & destination pairs
}
```

No schema version bump needed — `transferId` is not part of the Dexie `stores()` index definition. Dexie allows extra unindexed fields on existing tables without a version change.

## Transfer Logic

Single function in `usePockets`:

```
transferBetweenPockets(fromPocketId, toPocketId, amount)
```

1. Generate one `crypto.randomUUID()` as `transferId`
2. Create expense transaction:
   - `type: "expense"`, `amount`, `pocketId: fromPocketId`, `transferId`, `category: "Pindah Saldo"`, `merchant: "Transfer ke {nama pocket tujuan}"`, `timestamp: Date.now()`
3. Create income transaction:
   - `type: "income"`, `amount`, `pocketId: toPocketId`, `transferId`, `category: "Pindah Saldo"`, `merchant: "Transfer dari {nama pocket sumber}"`, `timestamp: Date.now() + 1` (to preserve ordering)
4. Both transactions visible in the transaction list (can be hidden via toggle)

**Balance math is unaffected** — income/expense per-pocket calculations already handle this correctly without changes.

## UI Components

### TransferModal (new)

Modal for initiating a transfer.

- **Source pocket**: dropdown of all pockets
- **Destination pocket**: dropdown of all pockets (auto-filters selected source)
- **Amount**: numeric input, must be > 0 and ≤ source pocket balance
- **Submit validation**:
  - Source ≠ destination
  - Amount > 0
  - Amount ≤ source balance (soft warning, not hard block — user might be transferring from an external source not recorded in the system)
- On submit: calls `onTransfer(fromId, toId, amount)`, closes modal, shows success feedback

Uses existing `ResponsiveModal` wrapper.

### PocketCard Changes

Add "Transfer Saldo" option in the ⋮ context menu, between "Ganti Nama" and "Hapus":

```
[Ganti Nama]
[Transfer Saldo]    ← new
[Hapus]
```

New prop: `onTransfer: (pocket: Pocket) => void`

### PocketGrid Changes

1. `PocketCard` receives the new `onTransfer` prop
2. New "Transfer" button in the filter bar, to the right of "Semua Kantong":

```
[Semua Kantong] [Transfer]    Menampilkan transaksi kantong terpilih
```

Opens `TransferModal` without a pre-selected source pocket.

### Budget Page Changes

- State: `transferFrom: Pocket | null` — when set, opens TransferModal with pre-selected source
- State: `showTransfer: boolean` — toggles TransferModal without pre-selection (from the bar button)
- Render `TransferModal` at page level, wired to `transferBetweenPockets` from `usePockets`
- Option to toggle transfer visibility in TransactionList (filter by `transferId`)

## Files Changed

| File | Change |
|------|--------|
| `src/lib/db.ts` | Add `transferId?: string` to `Transaction` interface |
| `src/hooks/usePockets.ts` | Add `transferBetweenPockets()` function |
| `src/components/budget/TransferModal.tsx` | NEW — transfer form modal |
| `src/components/budget/PocketCard.tsx` | Add "Transfer Saldo" menu item + `onTransfer` prop |
| `src/components/budget/PocketGrid.tsx` | Add Transfer button in filter bar + pass `onTransfer` |
| `src/app/budget/page.tsx` | Wire transfer state + Modal |
| `src/components/shared/TransactionList.tsx` | Optional toggle to hide/show transfers |
