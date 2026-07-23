# Fix Net Worth Chart Timeline

## Problem

The "Kekayaan Bersih" (Net Worth) chart shows a flat line across all months because `computeMonthlyNetWorth` uses the current `balance` (total pocket balance) which has no timestamp. The current balance is applied to all 12 months, making the chart inaccurate.

In contrast, the "Pendapatan" (Income) chart works correctly because transactions have timestamps, so income is calculated per-month.

## Solution

Modify `computeMonthlyNetWorth` to calculate balance per-month from cumulative income - expense transactions, instead of using the static current balance.

## Changes

### 1. `src/lib/monthlyChart.ts` — `computeMonthlyNetWorth`

**Before:**
```typescript
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  balance: number,      // ← current balance, no timestamp
  debts: DebtEntry[],
): MonthlyDataPoint[]
```

**After:**
```typescript
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  transactions: Transaction[],  // ← NEW: for balance history
  debts: DebtEntry[],
): MonthlyDataPoint[]
```

**New logic for balance per-month:**
```
For each month (last 12 months):
  1. Calculate total income in this month from transactions
  2. Calculate total expense in this month from transactions
  3. Balance this month = cumulative (income - expense) from first month
  4. Net worth = balance + assets - liabilities - debts
```

### 2. `src/components/dashboard/MonthlyChart.tsx`

Update the `computeMonthlyNetWorth` call:
```typescript
// Before:
computeMonthlyNetWorth(assets, liabilities, balance, debts)

// After:
computeMonthlyNetWorth(assets, liabilities, transactions, debts)
```

### 3. `src/app/dashboard/page.tsx`

Pass `transactions` to MonthlyChart and remove `balance` prop:
```typescript
<MonthlyChart
  transactions={transactions}
  assets={assets}
  liabilities={liabilities}
  debts={debts}
/>
```

## Expected Result

- **Grafik "Pendapatan"** → unchanged (income per month)
- **Grafik "Kekayaan Bersih"** → shows balance progression over time
  - If user has income Rp 5jt in July, chart shows increase in July
  - Assets/liabilities/debts still filtered by `createdAt` (existing logic)
  - Net worth = balance (from transactions) + assets - liabilities - debts

## Trade-offs

- ✅ No schema changes required
- ✅ Consistent with income chart approach
- ✅ Simple and easy to understand
- ⚠️ Pocket transfers don't affect net worth chart (by design decision)
