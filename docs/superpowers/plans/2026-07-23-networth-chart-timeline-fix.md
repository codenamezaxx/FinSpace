# Net Worth Chart Timeline Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Net Worth chart to show balance progression over time by calculating balance from cumulative income - expense transactions instead of using static current balance.

**Architecture:** Modify `computeMonthlyNetWorth` to accept transactions and calculate balance per-month from cumulative income - expense. Assets/liabilities/debts continue to use `createdAt` timestamps.

**Tech Stack:** TypeScript, React, Dexie.js (IndexedDB), Recharts

## Global Constraints

- TypeScript strict mode enabled
- Tailwind CSS v4 with design tokens in `globals.css`
- Dexie.js for IndexedDB operations
- Recharts for charting
- No new dependencies required

---

### Task 1: Update `computeMonthlyNetWorth` function signature and logic

**Files:**
- Modify: `src/lib/monthlyChart.ts:61-105`

**Interfaces:**
- Consumes: `Transaction[]` from `src/lib/db.ts`
- Produces: `MonthlyDataPoint[]` (same interface as before)

- [ ] **Step 1: Update function signature**

Change the function signature to accept `transactions` instead of `balance`:

```typescript
// Before:
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  balance: number,
  debts: DebtEntry[],
): MonthlyDataPoint[]

// After:
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  transactions: Transaction[],
  debts: DebtEntry[],
): MonthlyDataPoint[]
```

- [ ] **Step 2: Update import statement**

Add `Transaction` to the import statement:

```typescript
import type { Transaction } from "./db";
```

- [ ] **Step 3: Implement balance calculation from transactions**

Replace the balance calculation logic inside the function:

```typescript
export function computeMonthlyNetWorth(
  assets: AssetEntry[],
  liabilities: LiabilityEntry[],
  transactions: Transaction[],
  debts: DebtEntry[],
): MonthlyDataPoint[] {
  const now = new Date();
  const result: MonthlyDataPoint[] = [];
  let cumulativeBalance = 0;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("id-ID", { month: "short" });
    const startOfMonth = new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    ).getTime();
    const endOfMonth = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();

    // Calculate income and expense for this month
    const monthIncome = transactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.timestamp >= startOfMonth &&
          t.timestamp <= endOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.timestamp >= startOfMonth &&
          t.timestamp <= endOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Update cumulative balance
    cumulativeBalance += monthIncome - monthExpense;

    const assetsUpTo = assets
      .filter((a) => (a.createdAt ?? 0) <= endOfMonth)
      .reduce((sum, a) => sum + a.amount, 0);

    const liabilitiesUpTo = liabilities
      .filter((l) => (l.createdAt ?? 0) <= endOfMonth)
      .reduce((sum, l) => sum + l.amount, 0);

    const debtsUpTo = debts
      .filter((d) => d.createdAt <= endOfMonth)
      .reduce((sum, d) => {
        const paid = d.createdAt <= endOfMonth ? d.paidAmount : 0;
        return sum + Math.max(0, d.totalAmount - paid);
      }, 0);

    result.push({
      month: monthLabel,
      value: cumulativeBalance + assetsUpTo - liabilitiesUpTo - debtsUpTo,
    });
  }

  return result;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/monthlyChart.ts
git commit -m "fix(chart): update computeMonthlyNetWorth to calculate balance from transactions"
```

---

### Task 2: Update MonthlyChart component to pass transactions

**Files:**
- Modify: `src/components/dashboard/MonthlyChart.tsx:23-29, 96-99`

**Interfaces:**
- Consumes: `Transaction[]` from props
- Produces: Updated `MonthlyChartProps` interface

- [ ] **Step 1: Update MonthlyChartProps interface**

Add `transactions` to the props interface:

```typescript
interface MonthlyChartProps {
  transactions: Transaction[];
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
  debts?: DebtEntry[];
  // Remove balance?: number;
}
```

- [ ] **Step 2: Update function parameters**

Update the MonthlyChart function to destructure `transactions`:

```typescript
export function MonthlyChart({
  transactions,
  assets,
  liabilities,
  debts = [],
}: MonthlyChartProps) {
```

- [ ] **Step 3: Update computeMonthlyNetWorth call**

Change the useMemo hook to pass transactions:

```typescript
const netWorthData = useMemo(
  () => computeMonthlyNetWorth(assets, liabilities, transactions, debts),
  [assets, liabilities, transactions, debts]
);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/MonthlyChart.tsx
git commit -m "fix(chart): update MonthlyChart to pass transactions to computeMonthlyNetWorth"
```

---

### Task 3: Update Dashboard page to pass transactions

**Files:**
- Modify: `src/app/dashboard/page.tsx` (find MonthlyChart usage)

**Interfaces:**
- Consumes: `transactions` from `useTransactions()` hook
- Produces: Updated MonthlyChart props

- [ ] **Step 1: Find MonthlyChart usage in dashboard page**

Search for `<MonthlyChart` in `src/app/dashboard/page.tsx`

- [ ] **Step 2: Update MonthlyChart props**

Remove `balance` prop and ensure `transactions` is passed:

```typescript
<MonthlyChart
  transactions={transactions}
  assets={assets}
  liabilities={liabilities}
  debts={debts}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix(chart): update dashboard to pass transactions to MonthlyChart"
```

---

### Task 4: Test the fix in browser

**Files:**
- None (manual testing)

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Navigate to dashboard**

Open browser to `http://localhost:3000/dashboard`

- [ ] **Step 3: Test Income chart**

Click "Pendapatan" tab → verify chart shows income per month (should work as before)

- [ ] **Step 4: Test Net Worth chart**

Click "Kekayaan Bersih" tab → verify chart now shows balance progression over time (should NOT be flat)

- [ ] **Step 5: Verify with transactions**

If user has transactions, verify that:
- Months with income show increase
- Months with expense show decrease
- Assets/liabilities/debts are still included in the calculation

- [ ] **Step 6: Final commit if needed**

If any adjustments were made, commit them.
