# Task 7 Report: Wealth Page Debt Integration

## Summary

Integrated debts, balance computation, and purchase flow into `src/app/wealth/page.tsx`. All existing functionality (asset/liability CRUD, financial ratios, speedometer) preserved.

## Changes Made

- **`src/app/wealth/page.tsx`**: Major update with:

### Imports
- Added `DebtForm`, `PayDebtModal`, `DebtList` components
- Added `loadFromStorage`, `saveToStorage` from `@/lib/storage` (replaced local `loadFromStorage`)
- Added `DebtEntry` type to existing netWorth type import

### State
- `debts: DebtEntry[]` — loaded from `finspace_debts` localStorage key
- `showDebtForm: boolean` — toggles DebtForm modal
- `payingDebt: DebtEntry | null` — target for PayDebtModal

### Balance Computation
- Added `useTransactions()` call (all-time, no filter) as `allTransactions`
- `totalBalance` memo: `income - expense` across all transactions

### Net Worth Calculation
- Updated `calculateNetWorth` call to pass `totalBalance` and `debts` (4-arg signature)

### Handlers
- `handleAddDebt` — appends debt, saves to localStorage, dispatches `finspace-debts-updated`
- `handlePayDebt` — updates `paidAmount`, saves, dispatches event, creates "Cicilan" expense transaction
- `handleDeleteDebt` — filters out debt, saves, dispatches event
- `handlePurchase` — creates "Pembelian Liabilitas" expense transaction when buying from balance

### UI Additions
- **"Saldo Tercatat"** auto-item rendered as first asset entry with `border-l-primary` styling
- **Debt section** below asset/liability grid with header "Utang" + "Tambah Utang" button
- **DebtForm modal** wired via `showDebtForm` state
- **PayDebtModal** wired via `payingDebt` state

### Modal Context Integration
- `openAssetLiabilityModal` now passes `onPurchase: handlePurchase` and `currentBalance: totalBalance`

### Event Listeners
- Added `finspace-debts-updated` listener to `loadData` (alongside existing `finspace-assets-updated`)
- Both listeners cleaned up on unmount

## Verification

| Check | Result |
|---|---|
| `npm run build` | ✅ Compiled successfully (0 errors) |
| `npx vitest run` | ✅ 2 files, 9 tests passed |
